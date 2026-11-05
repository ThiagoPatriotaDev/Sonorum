-- SONORUM V9 / PROMPT 03 / instalar SOMENTE depois do SQL 01_auth_e_perfis.sql.
-- Execute no SQL Editor do projeto Sonorum. Não reexecute o instalador completo da V7.
-- Novo schema patrimonial: cada linha de instruments = um exemplar físico (patrimônio único).
-- IMPORTANTE: inspecione tabelas homônimas antes de aplicar em projeto que já possua dados.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS public.instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code text NOT NULL UNIQUE CHECK (char_length(btrim(asset_code)) BETWEEN 3 AND 45),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  category text NOT NULL CHECK (char_length(btrim(category)) BETWEEN 2 AND 75),
  conservation text NOT NULL DEFAULT 'good' CHECK (conservation IN ('excellent','good','fair','needs_repair')),
  photo_url text CHECK (photo_url IS NULL OR (char_length(photo_url)<=800 AND photo_url ~ '^https://')),
  location text NOT NULL DEFAULT '' CHECK (char_length(location)<=140),
  description text NOT NULL DEFAULT '' CHECK (char_length(description)<=700),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','maintenance','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.instrument_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES public.instruments(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  purpose text NOT NULL CHECK (char_length(btrim(purpose)) BETWEEN 5 AND 500),
  requested_until date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','checked_out','returned','rejected','cancelled')),
  due_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  decision_note text,
  checked_out_at timestamptz,
  checked_out_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  checkout_condition text CHECK (checkout_condition IS NULL OR checkout_condition IN ('excellent','good','fair','needs_repair')),
  checkout_note text,
  returned_at timestamptz,
  returned_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  return_condition text CHECK (return_condition IS NULL OR return_condition IN ('excellent','good','fair','needs_repair')),
  return_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- MIGRAÇÃO ADITIVA: o kit inicial do MVP usava asset_tag / borrower_id /
-- condition_status / condition_out. A V7 não criava essas tabelas. Ambos são aceitos.
-- Nenhum empréstimo é excluído e os campos antigos permanecem para auditoria.
ALTER TABLE public.instruments ADD COLUMN IF NOT EXISTS asset_code text;
ALTER TABLE public.instruments ADD COLUMN IF NOT EXISTS conservation text DEFAULT 'good';
ALTER TABLE public.instruments ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.instruments ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';
ALTER TABLE public.instruments ADD COLUMN IF NOT EXISTS location text DEFAULT '';
ALTER TABLE public.instruments ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS requested_until date;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS decision_note text;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS checked_out_at timestamptz;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS checked_out_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS checkout_condition text;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS checkout_note text;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS returned_at timestamptz;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS returned_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS return_condition text;
ALTER TABLE public.instrument_loans ADD COLUMN IF NOT EXISTS return_note text;
DO $migration$
BEGIN
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='instruments' AND column_name='asset_tag') THEN
   EXECUTE 'UPDATE public.instruments SET asset_code=upper(btrim(asset_tag)) WHERE asset_code IS NULL';
   EXECUTE 'ALTER TABLE public.instruments ALTER COLUMN asset_tag DROP NOT NULL';
 END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='instruments' AND column_name='condition_status') THEN
   EXECUTE $$UPDATE public.instruments SET conservation=CASE
      WHEN condition_status='unavailable' THEN 'needs_repair' ELSE condition_status END
      WHERE conservation IS NULL OR conservation='good'$$;
 END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='instruments' AND column_name='notes') THEN
   EXECUTE $$UPDATE public.instruments SET description=left(coalesce(notes,''),700)
     WHERE coalesce(description,'')=''$$;
 END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='instruments' AND column_name='active') THEN
   EXECUTE $$UPDATE public.instruments SET status=CASE WHEN NOT active THEN 'inactive'
     WHEN conservation='needs_repair' THEN 'maintenance' ELSE 'available' END$$;
 END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='instrument_loans' AND column_name='borrower_id') THEN
   EXECUTE 'UPDATE public.instrument_loans SET student_id=borrower_id WHERE student_id IS NULL';
   EXECUTE 'ALTER TABLE public.instrument_loans ALTER COLUMN borrower_id DROP NOT NULL';
 END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='instrument_loans' AND column_name='approved_by') THEN
   EXECUTE 'UPDATE public.instrument_loans SET reviewed_by=approved_by WHERE reviewed_by IS NULL';
 END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='instrument_loans' AND column_name='condition_out') THEN
   EXECUTE $$UPDATE public.instrument_loans
      SET checkout_condition=CASE WHEN condition_out IN ('excellent','good','fair','needs_repair')
        THEN condition_out ELSE NULL END,
      checkout_note=CASE WHEN condition_out NOT IN ('excellent','good','fair','needs_repair')
        THEN left('Registro legado: ' || condition_out,700) ELSE checkout_note END
      WHERE checkout_condition IS NULL$$;
 END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='instrument_loans' AND column_name='condition_return') THEN
   EXECUTE $$UPDATE public.instrument_loans
     SET return_condition=CASE WHEN condition_return IN ('excellent','good','fair','needs_repair')
       THEN condition_return ELSE NULL END,
     return_note=CASE WHEN condition_return NOT IN ('excellent','good','fair','needs_repair')
       THEN left('Registro legado: '|| condition_return,700) ELSE return_note END
     WHERE return_condition IS NULL$$;
 END IF;
END;
$migration$;
UPDATE public.instrument_loans SET requested_until=(coalesce(due_at,created_at) AT TIME ZONE 'America/Recife')::date
 WHERE requested_until IS NULL;
UPDATE public.instruments SET description='' WHERE description IS NULL;
UPDATE public.instruments SET location='' WHERE location IS NULL;
UPDATE public.instruments SET conservation='good' WHERE conservation IS NULL;
UPDATE public.instruments SET status='available' WHERE status IS NULL;
ALTER TABLE public.instruments ALTER COLUMN asset_code SET NOT NULL;
ALTER TABLE public.instruments ALTER COLUMN conservation SET NOT NULL;
ALTER TABLE public.instruments ALTER COLUMN description SET NOT NULL;
ALTER TABLE public.instruments ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.instrument_loans ALTER COLUMN student_id SET DEFAULT auth.uid();
ALTER TABLE public.instrument_loans ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE public.instrument_loans ALTER COLUMN requested_until SET NOT NULL;
-- Remover apenas triggers LEGADOS que concorreriam com a guarda nova.
DROP TRIGGER IF EXISTS sonorum_loans_guard ON public.instrument_loans;
DROP TRIGGER IF EXISTS sonorum_loans_touch ON public.instrument_loans;
DROP TRIGGER IF EXISTS sonorum_instruments_touch ON public.instruments;
CREATE UNIQUE INDEX IF NOT EXISTS instruments_asset_code_unique_idx ON public.instruments(asset_code);
-- Constraints extras para a variante legada criada pelo kit inicial do MVP.
DO $checks$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.instruments'::regclass AND conname='sonorum_instrument_fields_valid') THEN
  ALTER TABLE public.instruments ADD CONSTRAINT sonorum_instrument_fields_valid CHECK(
   char_length(btrim(asset_code)) BETWEEN 3 AND 45 AND char_length(btrim(name)) BETWEEN 2 AND 120
   AND char_length(btrim(category)) BETWEEN 2 AND 75
   AND conservation IN ('excellent','good','fair','needs_repair')
   AND status IN ('available','maintenance','inactive')
   AND char_length(coalesce(location,''))<=140 AND char_length(coalesce(description,''))<=700
   AND (photo_url IS NULL OR (char_length(photo_url)<=800 AND photo_url ~ '^https://'))
  );
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.instrument_loans'::regclass AND conname='sonorum_instrument_loan_fields_valid') THEN
  ALTER TABLE public.instrument_loans ADD CONSTRAINT sonorum_instrument_loan_fields_valid CHECK(
   char_length(btrim(purpose)) BETWEEN 5 AND 500
   AND status IN ('pending','approved','checked_out','returned','rejected','cancelled')
   AND (checkout_condition IS NULL OR checkout_condition IN ('excellent','good','fair','needs_repair'))
   AND (return_condition IS NULL OR return_condition IN ('excellent','good','fair','needs_repair'))
  );
 END IF;
END $checks$;


-- Garantia transacional e concorrente: o índice único PARCIAL protege exemplares, não categorias.
-- Duas aprovações simultâneas da mesma peça: uma terá erro 23505.
CREATE UNIQUE INDEX IF NOT EXISTS instrument_loans_one_active_per_asset
  ON public.instrument_loans (instrument_id) WHERE status IN ('approved','checked_out');
DROP INDEX IF EXISTS public.instrument_loans_one_active_idx;
CREATE INDEX IF NOT EXISTS instrument_loans_student_history_idx ON public.instrument_loans(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS instrument_loans_queue_idx ON public.instrument_loans(status,created_at DESC);
CREATE INDEX IF NOT EXISTS instrument_loans_asset_history_idx ON public.instrument_loans(instrument_id,created_at DESC);
CREATE INDEX IF NOT EXISTS instruments_category_idx ON public.instruments(category,status);

-- Atualização de acervo, respeitando empréstimos em andamento.
CREATE OR REPLACE FUNCTION private.sonorum_instruments_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
 IF NOT (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])) THEN
   RAISE EXCEPTION 'Acesso restrito ao acervo' USING ERRCODE='42501';
 END IF;
 NEW.asset_code := upper(btrim(NEW.asset_code));
 NEW.name := btrim(NEW.name);
 NEW.category := btrim(NEW.category);
 NEW.location := btrim(NEW.location);
 NEW.description := btrim(NEW.description);
 IF TG_OP='UPDATE' THEN
   IF NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
     RAISE EXCEPTION 'Identificador imutável' USING ERRCODE='23514';
   END IF;
   IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'available'
       AND EXISTS (SELECT 1 FROM public.instrument_loans l WHERE l.instrument_id=NEW.id
                   AND l.status IN ('approved','checked_out')) THEN
     RAISE EXCEPTION 'Exemplar com empréstimo ativo' USING ERRCODE='23514';
   END IF;
 END IF;
 NEW.updated_at := now();
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sonorum_instruments_guard_trigger ON public.instruments;
CREATE TRIGGER sonorum_instruments_guard_trigger BEFORE INSERT OR UPDATE ON public.instruments
FOR EACH ROW EXECUTE FUNCTION private.sonorum_instruments_guard();

-- Todas as transições devem acontecer sob a identidade de auth.uid().
-- Nenhum user_id, nome de operador ou marca temporal recebidos do navegador são confiáveis.
CREATE OR REPLACE FUNCTION private.sonorum_instrument_loans_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE actor uuid := auth.uid(); is_staff boolean;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Login necessário' USING ERRCODE='42501'; END IF;
 is_staff := (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin']));
 IF TG_OP='INSERT' THEN
   IF NOT (SELECT private.sonorum_has_role(ARRAY['student']))
      OR NEW.student_id IS DISTINCT FROM actor OR NEW.status <> 'pending' THEN
     RAISE EXCEPTION 'Solicitação não autorizada' USING ERRCODE='42501';
   END IF;
   IF NEW.requested_until < (now() AT TIME ZONE 'America/Recife')::date
      OR NEW.requested_until > (now() AT TIME ZONE 'America/Recife')::date + 180 THEN
     RAISE EXCEPTION 'Prazo solicitado inválido' USING ERRCODE='23514';
   END IF;
   IF NOT EXISTS(SELECT 1 FROM public.instruments i WHERE i.id=NEW.instrument_id AND i.status='available') THEN
     RAISE EXCEPTION 'Exemplar indisponível' USING ERRCODE='23514';
   END IF;
   NEW.due_at:=NULL; NEW.reviewed_by:=NULL; NEW.reviewed_at:=NULL; NEW.decision_note:=NULL;
   NEW.checked_out_at:=NULL; NEW.checked_out_by:=NULL; NEW.checkout_condition:=NULL; NEW.checkout_note:=NULL;
   NEW.returned_at:=NULL; NEW.returned_by:=NULL; NEW.return_condition:=NULL; NEW.return_note:=NULL;
   RETURN NEW;
 END IF;

 IF (NEW.id,NEW.instrument_id,NEW.student_id,NEW.purpose,NEW.requested_until,NEW.created_at)
    IS DISTINCT FROM (OLD.id,OLD.instrument_id,OLD.student_id,OLD.purpose,OLD.requested_until,OLD.created_at) THEN
    RAISE EXCEPTION 'Dados originais do empréstimo são imutáveis' USING ERRCODE='23514';
 END IF;
 IF NEW.status=OLD.status THEN RAISE EXCEPTION 'Transição de estado obrigatória' USING ERRCODE='23514'; END IF;
 -- Rejeita manipulação dos campos de auditoria, mesmo que privilégios sejam alterados por engano.
 NEW.reviewed_by:=OLD.reviewed_by; NEW.reviewed_at:=OLD.reviewed_at;
 NEW.checked_out_by:=OLD.checked_out_by; NEW.checked_out_at:=OLD.checked_out_at;
 NEW.returned_by:=OLD.returned_by; NEW.returned_at:=OLD.returned_at;
 NEW.updated_at:=now();

 IF OLD.status='pending' AND NEW.status='approved' AND is_staff THEN
   IF NOT EXISTS(SELECT 1 FROM public.instruments i WHERE i.id=NEW.instrument_id AND i.status='available') THEN
      RAISE EXCEPTION 'Exemplar indisponível' USING ERRCODE='23514';
   END IF;
   IF NEW.due_at IS NULL OR NEW.due_at<=now() OR NEW.due_at>now()+interval '180 days' THEN
      RAISE EXCEPTION 'Prazo de devolução inválido' USING ERRCODE='23514';
   END IF;
   NEW.reviewed_by:=actor; NEW.reviewed_at:=now(); NEW.decision_note:=NULL;
 ELSIF OLD.status='pending' AND NEW.status='rejected' AND is_staff THEN
   IF char_length(btrim(coalesce(NEW.decision_note,'')))<5 THEN
      RAISE EXCEPTION 'Justifique a recusa' USING ERRCODE='23514';
   END IF;
   NEW.due_at:=NULL; NEW.reviewed_by:=actor; NEW.reviewed_at:=now();
 ELSIF OLD.status='pending' AND NEW.status='cancelled'
      AND (is_staff OR OLD.student_id=actor) THEN
   IF is_staff AND char_length(btrim(coalesce(NEW.decision_note,'')))<5 THEN
      RAISE EXCEPTION 'Justifique o cancelamento' USING ERRCODE='23514';
   END IF;
   NEW.due_at:=NULL; NEW.reviewed_by:=actor; NEW.reviewed_at:=now();
 ELSIF OLD.status='approved' AND NEW.status='checked_out' AND is_staff THEN
   IF NEW.checkout_condition NOT IN ('excellent','good','fair','needs_repair') OR NEW.checkout_condition IS NULL THEN
      RAISE EXCEPTION 'Informe o estado na retirada' USING ERRCODE='23514';
   END IF;
   NEW.checked_out_by:=actor; NEW.checked_out_at:=now(); NEW.due_at:=OLD.due_at;
 ELSIF OLD.status='checked_out' AND NEW.status='returned' AND is_staff THEN
   IF NEW.return_condition NOT IN ('excellent','good','fair','needs_repair') OR NEW.return_condition IS NULL THEN
      RAISE EXCEPTION 'Informe o estado na devolução' USING ERRCODE='23514';
   END IF;
   NEW.returned_by:=actor; NEW.returned_at:=now(); NEW.due_at:=OLD.due_at;
 ELSE
   RAISE EXCEPTION 'Transição não autorizada' USING ERRCODE='42501';
 END IF;
 -- Colunas não relacionadas à transição são restauradas ao valor original.
 IF NEW.status NOT IN ('approved') THEN NEW.due_at:=OLD.due_at; END IF;
 IF NEW.status NOT IN ('approved','rejected','cancelled') THEN NEW.decision_note:=OLD.decision_note; END IF;
 IF NEW.status <> 'checked_out' THEN NEW.checkout_condition:=OLD.checkout_condition;NEW.checkout_note:=OLD.checkout_note; END IF;
 IF NEW.status <> 'returned' THEN NEW.return_condition:=OLD.return_condition; NEW.return_note:=OLD.return_note; END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sonorum_instrument_loans_guard_trigger ON public.instrument_loans;
CREATE TRIGGER sonorum_instrument_loans_guard_trigger BEFORE INSERT OR UPDATE ON public.instrument_loans
FOR EACH ROW EXECUTE FUNCTION private.sonorum_instrument_loans_guard();

-- No retorno, atualiza a condição patrimonial e retira de circulação o que precisa de reparo.
CREATE OR REPLACE FUNCTION private.sonorum_update_asset_after_return() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
 IF NEW.status='returned' AND OLD.status='checked_out' THEN
   UPDATE public.instruments SET conservation=NEW.return_condition,
     status=CASE WHEN NEW.return_condition='needs_repair' THEN 'maintenance' ELSE status END
   WHERE id=NEW.instrument_id;
 END IF;
 RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS sonorum_instrument_loan_return_trigger ON public.instrument_loans;
CREATE TRIGGER sonorum_instrument_loan_return_trigger AFTER UPDATE OF status ON public.instrument_loans
FOR EACH ROW EXECUTE FUNCTION private.sonorum_update_asset_after_return();

-- Proibir DELETE na Data API: preservação histórica / auditabilidade.
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument_loans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.instruments, public.instrument_loans FROM anon, authenticated;
GRANT SELECT ON public.instruments, public.instrument_loans TO authenticated;
GRANT INSERT(asset_code,name,category,conservation,photo_url,location,description,status)
 ON public.instruments TO authenticated;
GRANT UPDATE(asset_code,name,category,conservation,photo_url,location,description,status)
 ON public.instruments TO authenticated;
GRANT INSERT(instrument_id,student_id,purpose,requested_until,status)
 ON public.instrument_loans TO authenticated;
GRANT UPDATE(status,due_at,decision_note,checkout_condition,checkout_note,return_condition,return_note)
 ON public.instrument_loans TO authenticated;
-- Retira políticas legadas permissivas do kit inicial, principalmente DELETE/SELECT amplos.
DO $policies$ DECLARE row_item record; BEGIN
 FOR row_item IN SELECT tablename,policyname FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('instruments','instrument_loans') LOOP
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',row_item.policyname,row_item.tablename);
 END LOOP;
END $policies$;
DROP POLICY IF EXISTS sonorum_asset_select ON public.instruments;
DROP POLICY IF EXISTS sonorum_asset_insert ON public.instruments;
DROP POLICY IF EXISTS sonorum_asset_update ON public.instruments;
DROP POLICY IF EXISTS sonorum_loan_select ON public.instrument_loans;
DROP POLICY IF EXISTS sonorum_loan_insert ON public.instrument_loans;
DROP POLICY IF EXISTS sonorum_loan_update ON public.instrument_loans;
CREATE POLICY sonorum_asset_select ON public.instruments FOR SELECT TO authenticated
 USING (status='available' OR (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));
CREATE POLICY sonorum_asset_insert ON public.instruments FOR INSERT TO authenticated
 WITH CHECK ((SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));
CREATE POLICY sonorum_asset_update ON public.instruments FOR UPDATE TO authenticated
 USING ((SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])))
 WITH CHECK ((SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));
CREATE POLICY sonorum_loan_select ON public.instrument_loans FOR SELECT TO authenticated
 USING(student_id=(SELECT auth.uid()) OR (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));
CREATE POLICY sonorum_loan_insert ON public.instrument_loans FOR INSERT TO authenticated
 WITH CHECK(student_id=(SELECT auth.uid()) AND status='pending' AND (SELECT private.sonorum_has_role(ARRAY['student'])));
CREATE POLICY sonorum_loan_update ON public.instrument_loans FOR UPDATE TO authenticated
 USING(student_id=(SELECT auth.uid()) OR (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])))
 WITH CHECK(student_id=(SELECT auth.uid()) OR (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));

-- Os nomes de estudantes não são liberados via SELECT amplo em profiles.
-- RPC de consulta apenas para operadores, com verificação de papel em função privada.
CREATE OR REPLACE FUNCTION private.sonorum_instrument_roster_private()
RETURNS TABLE(student_id uuid, display_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])) THEN
   RAISE EXCEPTION 'Acesso restrito' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT DISTINCT p.id,p.display_name FROM public.profiles p
 JOIN public.instrument_loans l ON l.student_id=p.id;
END;
$$;
CREATE OR REPLACE FUNCTION public.sonorum_instrument_roster()
RETURNS TABLE(student_id uuid,display_name text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT * FROM private.sonorum_instrument_roster_private();
$$;
REVOKE ALL ON FUNCTION private.sonorum_instrument_roster_private() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.sonorum_instrument_roster() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.sonorum_instrument_roster_private() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sonorum_instrument_roster() TO authenticated;

-- Ocupação pública para usuários LOGADOS, sem expor aluno/finalidade dos empréstimos.
CREATE OR REPLACE FUNCTION private.sonorum_instrument_busy_private()
RETURNS TABLE(instrument_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login necessário' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT DISTINCT l.instrument_id FROM public.instrument_loans l
 WHERE l.status IN ('approved','checked_out');
END;
$$;
CREATE OR REPLACE FUNCTION public.sonorum_instrument_busy()
RETURNS TABLE(instrument_id uuid)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT * FROM private.sonorum_instrument_busy_private();
$$;
REVOKE ALL ON FUNCTION private.sonorum_instrument_busy_private() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.sonorum_instrument_busy() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.sonorum_instrument_busy_private() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sonorum_instrument_busy() TO authenticated;

-- Upload opcional de fotos no bucket público; somente equipe pode gravar.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('sonorum-instruments','sonorum-instruments',true,2097152,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS sonorum_instrument_photos_insert ON storage.objects;
CREATE POLICY sonorum_instrument_photos_insert ON storage.objects FOR INSERT TO authenticated
 WITH CHECK (bucket_id='sonorum-instruments' AND (SELECT private.sonorum_has_role(ARRAY['staff','coordinator','admin'])));
-- Não conceder update/delete: arquivos do acervo preservados até definição da política de retenção.
COMMIT;
