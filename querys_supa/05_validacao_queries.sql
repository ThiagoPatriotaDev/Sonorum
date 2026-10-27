-- Consultas de leitura para validar a instalação (SQL Editor).
select 'profiles' tabela,count(*) registros from public.profiles
union all select 'user_roles',count(*) from public.user_roles
union all select 'sonorum_videos',count(*) from public.sonorum_videos
union all select 'sonorum_news',count(*) from public.sonorum_news
union all select 'sonorum_scores',count(*) from public.sonorum_scores
union all select 'sonorum_lesson_progress',count(*) from public.sonorum_lesson_progress;
select schemaname,tablename,rowsecurity from pg_tables where schemaname='public' and tablename in ('profiles','user_roles','sonorum_videos','sonorum_news','sonorum_scores','sonorum_lesson_progress') order by tablename;
select u.email,r.role from auth.users u join public.user_roles r on r.user_id=u.id order by u.created_at desc limit 10;
