-- Verificações SEM ALTERAR DADOS; execute no SQL Editor após instalar o arquivo 08.
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN ('instruments','instrument_loans');
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND indexname='instrument_loans_one_active_per_asset';
SELECT tablename,policyname,cmd FROM pg_policies WHERE schemaname='public' AND tablename IN ('instruments','instrument_loans') ORDER BY tablename,policyname;
SELECT table_name,privilege_type FROM information_schema.table_privileges WHERE grantee='authenticated' AND table_schema='public' AND table_name IN ('instruments','instrument_loans') ORDER BY table_name,privilege_type;
SELECT count(*) AS exemplares FROM public.instruments;
SELECT status,count(*) AS quantidade FROM public.instrument_loans GROUP BY status;
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='sonorum-instruments';
-- TESTE DE CONCORRÊNCIA (manual, não executar automaticamente): em 2 sessões com tokens de operadores,
-- aprovar 2 empréstimos pending do mesmo instrument_id. Uma aprovação deve falhar com 23505.
-- Confirmar que RETURNED libera o exemplar e que estudante A não lê o pedido de B.
