-- SONORUM / RF05-09 / Instalação incremental sobre a V7 (01_auth_e_perfis.sql).
-- Execute UMA VEZ no SQL Editor, em projeto previamente revisado. Faça backup se já houver dados.
-- Não requer chave secreta no frontend. Não modifica auth.users nem user_roles.
-- Compatível com as colunas originalmente propostas no kit do MVP.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.rooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 code text NOT NULL UNIQUE,
 name text NOT NULL,
 capacity integer NOT NULL CHECK (capacity > 0 AND capacity <= 200),
 location text,
 equipment text,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.room_reservations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
 student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 purpose text NOT NULL CHECK (char_length(trim(purpose)) BETWEEN 3 AND 500),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled','completed')),
 processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 decision_note text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT room_reservation_valid_window CHECK (ends_at > starts_at)
);
-- Constraints also protect direct Data API writes made outside the Express UI.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.rooms'::regclass AND conname='rooms_attributes_valid') THEN
  ALTER TABLE public.rooms ADD CONSTRAINT rooms_attributes_valid CHECK (
    char_length(trim(code)) BETWEEN 2 AND 25 AND char_length(trim(name)) BETWEEN 3 AND 100
    AND capacity BETWEEN 1 AND 200 AND char_length(coalesce(location,''))<=150
    AND char_length(coalesce(equipment,''))<=600
  );
 END IF;
END $$;
-- Metadata of resolution, separate from processed_by (person who made the approval/rejection).
ALTER TABLE public.room_reservations ADD COLUMN IF NOT EXISTS decided_at timestamptz;
ALTER TABLE public.room_reservations ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.room_reservations ADD COLUMN IF NOT EXISTS closed_at timestamptz;
-- If the original kit already defined the exclusion constraint, preserve it.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.room_reservations'::regclass AND conname='room_reservations_approved_no_overlap') THEN
  ALTER TABLE public.room_reservations
  ADD CONSTRAINT room_reservations_approved_no_overlap
  EXCLUDE USING gist (room_id WITH =, tstzrange(starts_at,ends_at,'[)') WITH &&)
  WHERE (status='approved');
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS rooms_active_code_idx ON public.rooms (active,code);
CREATE INDEX IF NOT EXISTS room_reservations_student_idx ON public.room_reservations (student_id,starts_at DESC);
CREATE INDEX IF NOT EXISTS room_reservations_room_idx ON public.room_reservations (room_id,starts_at);
CREATE INDEX IF NOT EXISTS room_reservations_operator_idx ON public.room_reservations (status,starts_at);

-- SECURITY: enforce all transitions in the database, including updates made without the Sonorum UI.
-- This replaces any older/less restrictive reservation guard from the initial SQL kit.
CREATE OR REPLACE FUNCTION private.sonorum_reservations_guard_v2() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE actor uuid := auth.uid(); operator_ok boolean;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Sessão necessária' USING ERRCODE='42501'; END IF;
 operator_ok := (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin']));
 IF TG_OP = 'INSERT' THEN
  IF NOT (SELECT private.sonorum_has_role(ARRAY['student'])) OR NEW.student_id IS DISTINCT FROM actor OR NEW.status <> 'pending' THEN
   RAISE EXCEPTION 'Solicitação não autorizada' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.rooms r WHERE r.id=NEW.room_id AND r.active) THEN
   RAISE EXCEPTION 'Sala indisponível' USING ERRCODE='23514';
  END IF;
  IF NEW.starts_at < now() OR NEW.starts_at > now()+interval '120 days' OR
     NEW.ends_at<=NEW.starts_at OR NEW.ends_at-NEW.starts_at<interval '30 minutes' OR
     NEW.ends_at-NEW.starts_at>interval '8 hours' THEN
   RAISE EXCEPTION 'Janela de reserva inválida' USING ERRCODE='23514';
  END IF;
  NEW.processed_by := NULL; NEW.decision_note := NULL; NEW.decided_at:=NULL;
  NEW.closed_by:=NULL; NEW.closed_at:=NULL;
  RETURN NEW;
 END IF;
 IF (NEW.id,NEW.room_id,NEW.student_id,NEW.starts_at,NEW.ends_at,NEW.purpose,NEW.created_at)
     IS DISTINCT FROM (OLD.id,OLD.room_id,OLD.student_id,OLD.starts_at,OLD.ends_at,OLD.purpose,OLD.created_at) THEN
   RAISE EXCEPTION 'Dados da solicitação não podem ser alterados' USING ERRCODE='42501';
 END IF;
 IF NEW.status=OLD.status THEN RAISE EXCEPTION 'Informe uma transição de estado' USING ERRCODE='23514'; END IF;
 -- Never trust submitted audit fields; only server-side trigger assigns them.
 NEW.processed_by:=OLD.processed_by; NEW.decided_at:=OLD.decided_at;
 NEW.closed_by:=OLD.closed_by; NEW.closed_at:=OLD.closed_at;
 IF OLD.status='pending' AND NEW.status IN ('approved','rejected') AND operator_ok THEN
   IF NEW.status='rejected' AND char_length(trim(coalesce(NEW.decision_note,'')))<5 THEN
    RAISE EXCEPTION 'Justificativa de recusa obrigatória (5 caracteres)' USING ERRCODE='23514';
   END IF;
   IF NEW.status='approved' AND NEW.starts_at<=now() THEN
    RAISE EXCEPTION 'Horário já iniciado: não é possível aprovar' USING ERRCODE='23514';
   END IF;
   IF NEW.status='approved' AND NOT EXISTS(SELECT 1 FROM public.rooms r WHERE r.id=OLD.room_id AND r.active) THEN
    RAISE EXCEPTION 'Sala desativada' USING ERRCODE='23514';
   END IF;
   NEW.processed_by:=actor; NEW.decided_at:=now();
 ELSIF OLD.status='pending' AND NEW.status='cancelled' AND (actor=OLD.student_id OR operator_ok) THEN
   IF actor<>OLD.student_id AND char_length(trim(coalesce(NEW.decision_note,'')))<5 THEN
    RAISE EXCEPTION 'Justificativa obrigatória para cancelamento administrativo' USING ERRCODE='23514';
   END IF;
   NEW.closed_by:=actor; NEW.closed_at:=now();
 ELSIF OLD.status='approved' AND NEW.status='cancelled' AND
       (operator_ok OR (actor=OLD.student_id AND now()<OLD.starts_at)) THEN
   IF actor<>OLD.student_id AND char_length(trim(coalesce(NEW.decision_note,'')))<5 THEN
    RAISE EXCEPTION 'Justificativa obrigatória para cancelamento administrativo' USING ERRCODE='23514';
   END IF;
   NEW.closed_by:=actor; NEW.closed_at:=now();
 ELSIF OLD.status='approved' AND NEW.status='completed' AND operator_ok AND now()>=OLD.ends_at THEN
   NEW.decision_note:=OLD.decision_note; NEW.closed_by:=actor; NEW.closed_at:=now();
 ELSE
   RAISE EXCEPTION 'Transição não autorizada ou fora do prazo' USING ERRCODE='23514';
 END IF;
 NEW.updated_at:=now();
 RETURN NEW;
END;
$$;
-- Remove the previous trigger name before adding the authoritative guard.
DROP TRIGGER IF EXISTS sonorum_reservations_guard ON public.room_reservations;
DROP TRIGGER IF EXISTS sonorum_reservations_guard_v2 ON public.room_reservations;
CREATE TRIGGER sonorum_reservations_guard_v2 BEFORE INSERT OR UPDATE ON public.room_reservations
FOR EACH ROW EXECUTE FUNCTION private.sonorum_reservations_guard_v2();

-- Private helper can read ONLY anonymized approved intervals to build availability.
-- Explicit auth check, no student IDs, purposes or decision notes returned.
CREATE OR REPLACE FUNCTION private.sonorum_room_busy_slots_internal(
 p_room_id uuid,p_from timestamptz,p_to timestamptz)
RETURNS TABLE(starts_at timestamptz,ends_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login necessário' USING ERRCODE='42501'; END IF;
 IF p_from IS NULL OR p_to IS NULL OR p_to<=p_from OR p_to-p_from>interval '62 days' THEN
  RAISE EXCEPTION 'Intervalo de consulta inválido' USING ERRCODE='22023';
 END IF;
 RETURN QUERY SELECT b.starts_at,b.ends_at FROM public.room_reservations b
 JOIN public.rooms r ON r.id=b.room_id AND r.active
 WHERE b.room_id=p_room_id AND b.status='approved' AND b.starts_at<p_to AND b.ends_at>p_from
 ORDER BY b.starts_at;
END;
$$;
-- Non-privileged RPC wrapper in exposed schema, avoids exposing definer to PostgREST.
CREATE OR REPLACE FUNCTION public.sonorum_room_busy_slots(
 p_room_id uuid,p_from timestamptz,p_to timestamptz)
RETURNS TABLE(starts_at timestamptz,ends_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT * FROM private.sonorum_room_busy_slots_internal(p_room_id,p_from,p_to);
$$;
REVOKE ALL ON FUNCTION private.sonorum_room_busy_slots_internal(uuid,timestamptz,timestamptz) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.sonorum_room_busy_slots(uuid,timestamptz,timestamptz) FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.sonorum_room_busy_slots_internal(uuid,timestamptz,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sonorum_room_busy_slots(uuid,timestamptz,timestamptz) TO authenticated;

-- Staff-only roster: a readable student name is essential for servicing a request.
-- Scope is limited to users who have actually requested a room; no emails exposed.
CREATE OR REPLACE FUNCTION private.sonorum_room_roster_internal()
RETURNS TABLE(student_id uuid, display_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT private.sonorum_has_role(ARRAY['staff','coordinator','admin']) THEN
  RAISE EXCEPTION 'Acesso restrito' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT DISTINCT p.id,p.display_name FROM public.profiles p
 JOIN public.room_reservations r ON r.student_id=p.id;
END;
$$;
CREATE OR REPLACE FUNCTION public.sonorum_room_roster()
RETURNS TABLE(student_id uuid, display_name text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT * FROM private.sonorum_room_roster_internal();
$$;
REVOKE ALL ON FUNCTION private.sonorum_room_roster_internal() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.sonorum_room_roster() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.sonorum_room_roster_internal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sonorum_room_roster() TO authenticated;

-- RLS AND COLUMN GRANTS: no private reservation details for other students.
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rooms,public.room_reservations FROM anon,authenticated;
GRANT SELECT ON public.rooms TO authenticated;
GRANT INSERT(code,name,capacity,location,equipment,active) ON public.rooms TO authenticated;
GRANT UPDATE(code,name,capacity,location,equipment,active) ON public.rooms TO authenticated;
GRANT SELECT ON public.room_reservations TO authenticated;
GRANT INSERT(room_id,student_id,starts_at,ends_at,purpose,status) ON public.room_reservations TO authenticated;
GRANT UPDATE(status,decision_note) ON public.room_reservations TO authenticated;
DO $$ DECLARE pol record; BEGIN
 FOR pol IN SELECT policyname,tablename FROM pg_policies WHERE schemaname='public' AND tablename IN ('rooms','room_reservations') LOOP
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',pol.policyname,pol.tablename);
 END LOOP;
END $$;
CREATE POLICY sonorum_rooms_select ON public.rooms FOR SELECT TO authenticated
 USING(active OR (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));
CREATE POLICY sonorum_rooms_insert ON public.rooms FOR INSERT TO authenticated
 WITH CHECK((SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));
CREATE POLICY sonorum_rooms_update ON public.rooms FOR UPDATE TO authenticated
 USING((SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])))
 WITH CHECK((SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));
CREATE POLICY sonorum_reservation_read ON public.room_reservations FOR SELECT TO authenticated
 USING(student_id=(SELECT auth.uid()) OR (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));
CREATE POLICY sonorum_reservation_insert ON public.room_reservations FOR INSERT TO authenticated
 WITH CHECK(student_id=(SELECT auth.uid()) AND status='pending' AND (SELECT private.sonorum_has_role(ARRAY['student'])));
CREATE POLICY sonorum_reservation_update ON public.room_reservations FOR UPDATE TO authenticated
 USING(student_id=(SELECT auth.uid()) OR (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])))
 WITH CHECK(student_id=(SELECT auth.uid()) OR (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));
COMMIT;
