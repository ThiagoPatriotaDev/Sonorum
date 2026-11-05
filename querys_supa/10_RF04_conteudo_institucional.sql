-- SONORUM V10 · RF04 · Conteúdo institucional. Executar APÓS 01_auth_e_perfis.sql.
-- Incremental, não apaga reservas, empréstimos, usuários ou notícias.
-- Publicação exige papel admin/coordinator e revisão registrada.
BEGIN;

CREATE TABLE IF NOT EXISTS public.course_pages (
  section text PRIMARY KEY CHECK (section IN ('curso','matriz','docentes','infraestrutura')),
  title text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(items) = 'array'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  published_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.course_page_reviews (
  section text PRIMARY KEY REFERENCES public.course_pages(section) ON DELETE CASCADE,
  revision integer NOT NULL,
  evidence_reference text NOT NULL CHECK (char_length(trim(evidence_reference)) BETWEEN 8 AND 500),
  lawful_basis text,
  verified_by uuid NOT NULL REFERENCES auth.users(id),
  verified_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.course_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 4 AND 160),
  category text NOT NULL CHECK (category IN ('apresentacao','oficina','projeto','encontro','outro')),
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT '',
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  published_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT course_events_date_check CHECK (end_at IS NULL OR end_at > start_at)
);
CREATE INDEX IF NOT EXISTS course_events_date_idx ON public.course_events (start_at) WHERE status='published';
CREATE TABLE IF NOT EXISTS public.course_event_reviews (
  event_id uuid PRIMARY KEY REFERENCES public.course_events(id) ON DELETE CASCADE,
  revision integer NOT NULL,
  evidence_reference text NOT NULL CHECK (char_length(trim(evidence_reference)) BETWEEN 8 AND 500),
  verified_by uuid NOT NULL REFERENCES auth.users(id),
  verified_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.course_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 150),
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL CHECK (image_url ~* '^https://[^[:space:]]+$'),
  alt_text text NOT NULL CHECK (char_length(trim(alt_text)) BETWEEN 8 AND 300),
  category text NOT NULL DEFAULT 'curso',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  published_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.course_gallery_reviews (
  gallery_id uuid PRIMARY KEY REFERENCES public.course_gallery(id) ON DELETE CASCADE,
  revision integer NOT NULL,
  legal_basis text NOT NULL CHECK (legal_basis IN ('consentimento','outra_hipotese_documentada')),
  evidence_reference text NOT NULL CHECK (char_length(trim(evidence_reference)) BETWEEN 8 AND 500),
  verified_by uuid NOT NULL REFERENCES auth.users(id),
  verified_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers: imutabilidade de autoria e revisão, revisão expira ao modificar conteúdo.
CREATE OR REPLACE FUNCTION private.sonorum_guard_course_page() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE p_review public.course_page_reviews%ROWTYPE;
BEGIN
  IF TG_OP='INSERT' THEN
    NEW.created_by := auth.uid(); NEW.revision := 1;
  ELSE
    NEW.created_by := OLD.created_by;
    IF (NEW.title, NEW.summary, NEW.body, NEW.items) IS DISTINCT FROM
       (OLD.title, OLD.summary, OLD.body, OLD.items) THEN
      NEW.revision := OLD.revision + 1;
      NEW.status := 'draft';
      NEW.published_at := null; NEW.published_by := null;
    ELSE NEW.revision := OLD.revision; END IF;
  END IF;
  NEW.updated_by := auth.uid(); NEW.updated_at := now();
  IF NEW.status='published' THEN
    SELECT * INTO p_review FROM public.course_page_reviews
    WHERE section=NEW.section AND revision=NEW.revision;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Validação editorial ausente ou desatualizada'; END IF;
    IF NEW.title='' OR length(trim(NEW.body)) < 25 THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Página sem conteúdo suficiente';
    END IF;
    IF NEW.section <> 'curso' AND jsonb_array_length(NEW.items)=0 THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Complete os registros da seção antes de publicar';
    END IF;
    IF NEW.section='docentes' AND (p_review.lawful_basis IS NULL OR length(trim(p_review.lawful_basis)) < 8) THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Documente a base adequada para dados de docentes';
    END IF;
    NEW.published_at := CASE WHEN TG_OP='UPDATE' AND OLD.status='published' THEN OLD.published_at ELSE now() END;
    NEW.published_by := auth.uid();
  ELSE NEW.published_at := null; NEW.published_by := null; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS sonorum_course_page_guard ON public.course_pages;
CREATE TRIGGER sonorum_course_page_guard BEFORE INSERT OR UPDATE ON public.course_pages
FOR EACH ROW EXECUTE FUNCTION private.sonorum_guard_course_page();

CREATE OR REPLACE FUNCTION private.sonorum_guard_course_event() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE e_review public.course_event_reviews%ROWTYPE;
BEGIN
  IF TG_OP='INSERT' THEN NEW.created_by:=auth.uid(); NEW.revision:=1;
  ELSE
    NEW.created_by:=OLD.created_by;
    IF (NEW.title,NEW.category,NEW.description,NEW.location,NEW.audience,NEW.start_at,NEW.end_at) IS DISTINCT FROM
       (OLD.title,OLD.category,OLD.description,OLD.location,OLD.audience,OLD.start_at,OLD.end_at) THEN
      NEW.revision:=OLD.revision+1; NEW.status:='draft';
      NEW.published_at:=null; NEW.published_by:=null;
    ELSE NEW.revision:=OLD.revision; END IF;
  END IF;
  NEW.updated_by:=auth.uid(); NEW.updated_at:=now();
  IF NEW.status='published' THEN
    SELECT * INTO e_review FROM public.course_event_reviews WHERE event_id=NEW.id AND revision=NEW.revision;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Evento não revisado nesta versão'; END IF;
    IF length(trim(NEW.description)) < 20 OR length(trim(NEW.location)) < 3 THEN
      RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Descrição e local são obrigatórios';
    END IF;
    NEW.published_by:=auth.uid();
    NEW.published_at:=CASE WHEN TG_OP='UPDATE' AND OLD.status='published' THEN OLD.published_at ELSE now() END;
  ELSE NEW.published_by:=null; NEW.published_at:=null; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS sonorum_course_event_guard ON public.course_events;
CREATE TRIGGER sonorum_course_event_guard BEFORE INSERT OR UPDATE ON public.course_events
FOR EACH ROW EXECUTE FUNCTION private.sonorum_guard_course_event();

CREATE OR REPLACE FUNCTION private.sonorum_guard_course_gallery() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE g_review public.course_gallery_reviews%ROWTYPE;
BEGIN
  IF TG_OP='INSERT' THEN NEW.created_by:=auth.uid(); NEW.revision:=1;
  ELSE
    NEW.created_by:=OLD.created_by;
    IF (NEW.title,NEW.description,NEW.image_url,NEW.alt_text,NEW.category) IS DISTINCT FROM
       (OLD.title,OLD.description,OLD.image_url,OLD.alt_text,OLD.category) THEN
      NEW.revision:=OLD.revision+1; NEW.status:='draft';
      NEW.published_by:=null; NEW.published_at:=null;
    ELSE NEW.revision:=OLD.revision; END IF;
  END IF;
  NEW.updated_by:=auth.uid(); NEW.updated_at:=now();
  IF NEW.status='published' THEN
    SELECT * INTO g_review FROM public.course_gallery_reviews WHERE gallery_id=NEW.id AND revision=NEW.revision;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='Imagem sem registro de autorização válido para esta versão'; END IF;
    NEW.published_by:=auth.uid();
    NEW.published_at:=CASE WHEN TG_OP='UPDATE' AND OLD.status='published' THEN OLD.published_at ELSE now() END;
  ELSE NEW.published_by:=null; NEW.published_at:=null; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS sonorum_course_gallery_guard ON public.course_gallery;
CREATE TRIGGER sonorum_course_gallery_guard BEFORE INSERT OR UPDATE ON public.course_gallery
FOR EACH ROW EXECUTE FUNCTION private.sonorum_guard_course_gallery();

ALTER TABLE public.course_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_page_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_gallery_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.course_pages, public.course_page_reviews, public.course_events, public.course_event_reviews, public.course_gallery, public.course_gallery_reviews FROM anon,authenticated;
GRANT SELECT ON public.course_pages, public.course_events, public.course_gallery TO anon,authenticated;
GRANT INSERT,UPDATE ON public.course_pages,public.course_events,public.course_gallery TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.course_page_reviews,public.course_event_reviews,public.course_gallery_reviews TO authenticated;
-- Sem DELETE para os clientes: preserva trilha de publicação e revisões.

-- Mantém esta migração repetível em bancos de desenvolvimento; recria somente suas próprias policies.
DROP POLICY IF EXISTS course_pages_public ON public.course_pages;
DROP POLICY IF EXISTS course_pages_editor ON public.course_pages;
DROP POLICY IF EXISTS course_pages_insert ON public.course_pages;
DROP POLICY IF EXISTS course_pages_update ON public.course_pages;
DROP POLICY IF EXISTS course_page_reviews_editor ON public.course_page_reviews;
DROP POLICY IF EXISTS course_page_reviews_insert ON public.course_page_reviews;
DROP POLICY IF EXISTS course_page_reviews_update ON public.course_page_reviews;
DROP POLICY IF EXISTS course_events_public ON public.course_events;
DROP POLICY IF EXISTS course_events_editor ON public.course_events;
DROP POLICY IF EXISTS course_events_insert ON public.course_events;
DROP POLICY IF EXISTS course_events_update ON public.course_events;
DROP POLICY IF EXISTS course_event_reviews_editor ON public.course_event_reviews;
DROP POLICY IF EXISTS course_event_reviews_insert ON public.course_event_reviews;
DROP POLICY IF EXISTS course_event_reviews_update ON public.course_event_reviews;
DROP POLICY IF EXISTS course_gallery_public ON public.course_gallery;
DROP POLICY IF EXISTS course_gallery_editor ON public.course_gallery;
DROP POLICY IF EXISTS course_gallery_insert ON public.course_gallery;
DROP POLICY IF EXISTS course_gallery_update ON public.course_gallery;
DROP POLICY IF EXISTS course_gallery_reviews_editor ON public.course_gallery_reviews;
DROP POLICY IF EXISTS course_gallery_reviews_insert ON public.course_gallery_reviews;
DROP POLICY IF EXISTS course_gallery_reviews_update ON public.course_gallery_reviews;
CREATE POLICY course_pages_public ON public.course_pages FOR SELECT TO anon,authenticated USING (status='published');
CREATE POLICY course_pages_editor ON public.course_pages FOR SELECT TO authenticated USING ((select private.sonorum_has_role(array['admin','coordinator'])));
CREATE POLICY course_pages_insert ON public.course_pages FOR INSERT TO authenticated WITH CHECK ((select private.sonorum_has_role(array['admin','coordinator'])));
CREATE POLICY course_pages_update ON public.course_pages FOR UPDATE TO authenticated USING ((select private.sonorum_has_role(array['admin','coordinator']))) WITH CHECK ((select private.sonorum_has_role(array['admin','coordinator'])));

CREATE POLICY course_page_reviews_editor ON public.course_page_reviews FOR SELECT TO authenticated USING ((select private.sonorum_has_role(array['admin','coordinator'])));
CREATE POLICY course_page_reviews_insert ON public.course_page_reviews FOR INSERT TO authenticated WITH CHECK ((select private.sonorum_has_role(array['admin','coordinator'])) AND verified_by=(select auth.uid()));
CREATE POLICY course_page_reviews_update ON public.course_page_reviews FOR UPDATE TO authenticated USING ((select private.sonorum_has_role(array['admin','coordinator']))) WITH CHECK ((select private.sonorum_has_role(array['admin','coordinator'])) AND verified_by=(select auth.uid()));

CREATE POLICY course_events_public ON public.course_events FOR SELECT TO anon,authenticated USING(status='published');
CREATE POLICY course_events_editor ON public.course_events FOR SELECT TO authenticated USING((select private.sonorum_has_role(array['admin','coordinator'])));
CREATE POLICY course_events_insert ON public.course_events FOR INSERT TO authenticated WITH CHECK((select private.sonorum_has_role(array['admin','coordinator'])));
CREATE POLICY course_events_update ON public.course_events FOR UPDATE TO authenticated USING((select private.sonorum_has_role(array['admin','coordinator']))) WITH CHECK((select private.sonorum_has_role(array['admin','coordinator'])));

CREATE POLICY course_event_reviews_editor ON public.course_event_reviews FOR SELECT TO authenticated USING((select private.sonorum_has_role(array['admin','coordinator'])));
CREATE POLICY course_event_reviews_insert ON public.course_event_reviews FOR INSERT TO authenticated WITH CHECK((select private.sonorum_has_role(array['admin','coordinator'])) AND verified_by=(select auth.uid()));
CREATE POLICY course_event_reviews_update ON public.course_event_reviews FOR UPDATE TO authenticated USING((select private.sonorum_has_role(array['admin','coordinator']))) WITH CHECK((select private.sonorum_has_role(array['admin','coordinator'])) AND verified_by=(select auth.uid()));

CREATE POLICY course_gallery_public ON public.course_gallery FOR SELECT TO anon,authenticated USING(status='published');
CREATE POLICY course_gallery_editor ON public.course_gallery FOR SELECT TO authenticated USING((select private.sonorum_has_role(array['admin','coordinator'])));
CREATE POLICY course_gallery_insert ON public.course_gallery FOR INSERT TO authenticated WITH CHECK((select private.sonorum_has_role(array['admin','coordinator'])));
CREATE POLICY course_gallery_update ON public.course_gallery FOR UPDATE TO authenticated USING((select private.sonorum_has_role(array['admin','coordinator']))) WITH CHECK((select private.sonorum_has_role(array['admin','coordinator'])));
CREATE POLICY course_gallery_reviews_editor ON public.course_gallery_reviews FOR SELECT TO authenticated USING((select private.sonorum_has_role(array['admin','coordinator'])));
CREATE POLICY course_gallery_reviews_insert ON public.course_gallery_reviews FOR INSERT TO authenticated WITH CHECK((select private.sonorum_has_role(array['admin','coordinator'])) AND verified_by=(select auth.uid()));
CREATE POLICY course_gallery_reviews_update ON public.course_gallery_reviews FOR UPDATE TO authenticated USING((select private.sonorum_has_role(array['admin','coordinator']))) WITH CHECK((select private.sonorum_has_role(array['admin','coordinator'])) AND verified_by=(select auth.uid()));

COMMIT;
