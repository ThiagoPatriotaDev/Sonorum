-- SONORUM V10 · VERIFICAÇÃO SOMENTE LEITURA
-- Execute APÓS a query 10. Não cria nem apaga dados.
SELECT table_name FROM information_schema.tables
 WHERE table_schema='public' AND table_name IN ('course_pages','course_page_reviews','course_events','course_event_reviews','course_gallery','course_gallery_reviews')
 ORDER BY table_name;

SELECT tablename,policyname,roles,cmd,qual,with_check
 FROM pg_policies
 WHERE schemaname='public' AND tablename IN ('course_pages','course_page_reviews','course_events','course_event_reviews','course_gallery','course_gallery_reviews')
 ORDER BY tablename,policyname;

SELECT relname,relrowsecurity FROM pg_class WHERE relname IN ('course_pages','course_page_reviews','course_events','course_event_reviews','course_gallery','course_gallery_reviews') ORDER BY relname;

SELECT 'course_pages' AS tabela,status,count(*) AS total FROM public.course_pages GROUP BY status
UNION ALL SELECT 'course_events',status,count(*) FROM public.course_events GROUP BY status
UNION ALL SELECT 'course_gallery',status,count(*) FROM public.course_gallery GROUP BY status;

-- Revisões pendentes para itens em rascunho (não mostra evidências particulares):
SELECT p.section,p.revision,coalesce(r.revision,0)=p.revision AS revisao_atual
 FROM public.course_pages p LEFT JOIN public.course_page_reviews r ON r.section=p.section;
SELECT e.id,e.title,e.revision,coalesce(r.revision,0)=e.revision AS revisao_atual
 FROM public.course_events e LEFT JOIN public.course_event_reviews r ON r.event_id=e.id;
SELECT g.id,g.title,g.revision,coalesce(r.revision,0)=g.revision AS autorizacao_atual
 FROM public.course_gallery g LEFT JOIN public.course_gallery_reviews r ON r.gallery_id=g.id;
