-- INSTALACAO COMPLETA: rode SOMENTE ESTE arquivo ou os arquivos 01 a 03 separadamente.
-- Leia README_SUPABASE.md; para projetos existentes faça backup.

-- INICIO 01_auth_e_perfis.sql
-- SONORUM RF03 / SQL Editor do Supabase / Executar primeiro.
-- Compatível com profiles(id,display_name,avatar_url) e user_roles(user_id,role) do MVP.
-- NÃO executa DROP TABLE, NÃO importa senhas. Antes de aplicar em base existente, faça backup.
begin;
create schema if not exists private;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(trim(display_name)) between 2 and 90),
 avatar_url text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.user_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'student' check(role in ('student','teacher','staff','coordinator','admin')),
 assigned_at timestamptz not null default now()
);
-- Função auxiliar em schema NÃO exposto pela Data API.
create or replace function private.sonorum_has_role(p_roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.user_roles r where r.user_id = (select auth.uid()) and r.role = any(p_roles));
$$;
revoke all on function private.sonorum_has_role(text[]) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.sonorum_has_role(text[]) to authenticated;

create or replace function private.sonorum_handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare display text;
begin
 display := left(trim(regexp_replace(coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1),'Estudante'), '\s+', ' ', 'g')),90);
 if length(display)<2 then display := 'Estudante'; end if;
 insert into public.profiles(id,display_name) values(new.id,display) on conflict(id) do nothing;
 -- Ignora COMPLETAMENTE role/role_requested/user_metadata/autodeclaração.
 insert into public.user_roles(user_id,role) values(new.id,'student') on conflict(user_id) do nothing;
 return new;
end;
$$;
revoke all on function private.sonorum_handle_new_user() from public,anon,authenticated;
drop trigger if exists sonorum_auth_user_created on auth.users;
create trigger sonorum_auth_user_created after insert on auth.users
for each row execute function private.sonorum_handle_new_user();
-- Se houver usuários já criados no Supabase antes do SQL, crie os registros ausentes.
insert into public.profiles(id,display_name)
select u.id,case when length(trim(coalesce(u.raw_user_meta_data->>'name',''))) between 2 and 90
then trim(u.raw_user_meta_data->>'name') else left(coalesce(split_part(u.email,'@',1),'Estudante'),90) end
from auth.users u where not exists (select 1 from public.profiles p where p.id=u.id)
on conflict(id) do nothing;
insert into public.user_roles(user_id,role)
select u.id,'student' from auth.users u where not exists(select 1 from public.user_roles r where r.user_id=u.id)
on conflict(user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
revoke all on public.profiles,public.user_roles from anon,authenticated;
grant select on public.profiles,public.user_roles to authenticated;
grant update(display_name,avatar_url) on public.profiles to authenticated;
-- Só administrador autorizado pela policy consegue atualizar role; nunca concede INSERT ao cliente.
grant update(role,assigned_at) on public.user_roles to authenticated;
drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists roles_read on public.user_roles;
drop policy if exists sonorum_profile_select on public.profiles;
drop policy if exists sonorum_profile_edit on public.profiles;
drop policy if exists sonorum_roles_select on public.user_roles;
drop policy if exists sonorum_roles_admin_update on public.user_roles;
create policy sonorum_profile_select on public.profiles for select to authenticated
using(id=(select auth.uid()) or (select private.sonorum_has_role(array['admin'])));
create policy sonorum_profile_edit on public.profiles for update to authenticated
using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy sonorum_roles_select on public.user_roles for select to authenticated
using(user_id=(select auth.uid()) or (select private.sonorum_has_role(array['admin'])));
create policy sonorum_roles_admin_update on public.user_roles for update to authenticated
using ((select private.sonorum_has_role(array['admin'])) and user_id <> (select auth.uid()) and role <> 'admin')
with check ((select private.sonorum_has_role(array['admin'])) and user_id <> (select auth.uid()) and role in ('student','teacher','staff','coordinator'));
commit;

-- FIM 01_auth_e_perfis.sql

-- INICIO 02_comunidade_redacao.sql
-- SONORUM / Executar após 01_auth_e_perfis.sql.
-- Substitui integralmente o armazenamento JSON do backend.
begin;
create table if not exists public.sonorum_videos (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 5 and 120),
 description text not null default '' check(char_length(description)<=500),
 instrument_id text not null check(instrument_id in ('violao','violino','teclado','flauta','canto','baixo','saxofone','bateria')),
 youtube_id text not null check(youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
 author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 author_name text not null default 'Comunidade Sonorum',
 author_role text not null default 'student',
 created_at timestamptz not null default now()
);
create index if not exists sonorum_videos_recent_idx on public.sonorum_videos(created_at desc);
create table if not exists public.sonorum_news (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 title text not null check(char_length(title) between 5 and 150),
 excerpt text not null default '' check(char_length(excerpt)<=300),
 body text not null default '' check(char_length(body)<=30000),
 category text not null default 'Curso' check(category in ('Curso','Eventos','Projetos','Conquistas','Comunicados')),
 cover_url text not null default '',
 featured boolean not null default false,
 status text not null default 'draft' check(status in ('draft','published','archived')),
 author_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
 author_name text not null default 'Equipe Sonorum',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 constraint sonorum_published_complete check(status <> 'published' or (char_length(excerpt)>0 and char_length(body)>=40))
);

-- A Data API poderia receber author_name/author_role falsificados. Estes gatilhos
-- registram a autoria a partir do usuário autenticado, não de campos do request.
create or replace function private.sonorum_video_authorship() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if tg_op='UPDATE' then
   new.author_id := old.author_id;
 else
   if new.author_id is distinct from (select auth.uid()) then
     raise exception 'Autor inválido' using errcode='42501';
   end if;
 end if;
 new.author_name := coalesce((select p.display_name from public.profiles p where p.id=new.author_id),'Comunidade Sonorum');
 new.author_role := coalesce((select r.role from public.user_roles r where r.user_id=new.author_id),'student');
 return new;
end;
$$;
revoke all on function private.sonorum_video_authorship() from public,anon,authenticated;
drop trigger if exists sonorum_videos_author on public.sonorum_videos;
create trigger sonorum_videos_author before insert on public.sonorum_videos
for each row execute function private.sonorum_video_authorship();

create or replace function private.sonorum_news_authorship() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if tg_op='UPDATE' then
   new.author_id := old.author_id;
   new.author_name := old.author_name;
   new.created_at := old.created_at;
   new.published_at := case when new.status='published' then coalesce(old.published_at,now()) else null end;
 else
   if new.author_id is distinct from (select auth.uid()) then
     raise exception 'Autor inválido' using errcode='42501';
   end if;
   new.author_name := coalesce((select p.display_name from public.profiles p where p.id=new.author_id),'Equipe Sonorum');
   new.published_at := case when new.status='published' then now() else null end;
 end if;
 new.updated_at := now();
 return new;
end;
$$;
revoke all on function private.sonorum_news_authorship() from public,anon,authenticated;
drop trigger if exists sonorum_news_author on public.sonorum_news;
create trigger sonorum_news_author before insert or update on public.sonorum_news
for each row execute function private.sonorum_news_authorship();

create index if not exists sonorum_news_status_date_idx on public.sonorum_news(status,published_at desc);
alter table public.sonorum_videos enable row level security;
alter table public.sonorum_news enable row level security;
revoke all on public.sonorum_videos,public.sonorum_news from anon,authenticated;
grant select on public.sonorum_videos,public.sonorum_news to anon,authenticated;
grant insert,delete on public.sonorum_videos to authenticated;
grant insert,update on public.sonorum_news to authenticated;
drop policy if exists sonorum_videos_public_read on public.sonorum_videos;
drop policy if exists sonorum_videos_owner_insert on public.sonorum_videos;
drop policy if exists sonorum_videos_owner_delete on public.sonorum_videos;
create policy sonorum_videos_public_read on public.sonorum_videos for select to anon,authenticated using(true);
create policy sonorum_videos_owner_insert on public.sonorum_videos for insert to authenticated with check(author_id=(select auth.uid()));
create policy sonorum_videos_owner_delete on public.sonorum_videos for delete to authenticated
using(author_id=(select auth.uid()) or (select private.sonorum_has_role(array['admin','coordinator'])));
drop policy if exists sonorum_news_read_public on public.sonorum_news;
drop policy if exists sonorum_news_read_staff on public.sonorum_news;
drop policy if exists sonorum_news_insert on public.sonorum_news;
drop policy if exists sonorum_news_update on public.sonorum_news;
create policy sonorum_news_read_public on public.sonorum_news for select to anon,authenticated using(status='published');
create policy sonorum_news_read_staff on public.sonorum_news for select to authenticated
using ((select private.sonorum_has_role(array['admin','coordinator']))
 or (author_id=(select auth.uid()) and (select private.sonorum_has_role(array['teacher']))));
create policy sonorum_news_insert on public.sonorum_news for insert to authenticated
with check(author_id=(select auth.uid()) and (
 (status='draft' and (select private.sonorum_has_role(array['admin','coordinator','teacher']))) or
 (status in ('published','archived') and (select private.sonorum_has_role(array['admin','coordinator'])))));
create policy sonorum_news_update on public.sonorum_news for update to authenticated
using ((select private.sonorum_has_role(array['admin','coordinator'])) or
 (status='draft' and author_id=(select auth.uid()) and (select private.sonorum_has_role(array['teacher']))))
with check ((select private.sonorum_has_role(array['admin','coordinator'])) or
 (status='draft' and author_id=(select auth.uid()) and (select private.sonorum_has_role(array['teacher']))));
commit;

-- FIM 02_comunidade_redacao.sql

-- INICIO 03_partituras_e_progresso.sql
-- SONORUM / Dados privados sincronizados. Não usar tabelas JSON locais.
begin;
create table if not exists public.sonorum_scores (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null default 'Sem título',
 score_data jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
create index if not exists sonorum_scores_owner_date on public.sonorum_scores(user_id,updated_at desc);
create table if not exists public.sonorum_lesson_progress (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 lesson_id text not null,
 completed boolean not null default false,
 primary key(user_id,lesson_id)
);
alter table public.sonorum_scores enable row level security;
alter table public.sonorum_lesson_progress enable row level security;
revoke all on public.sonorum_scores,public.sonorum_lesson_progress from anon,authenticated;
grant select,insert,update,delete on public.sonorum_scores,public.sonorum_lesson_progress to authenticated;
drop policy if exists sonorum_scores_own on public.sonorum_scores;
drop policy if exists sonorum_progress_own on public.sonorum_lesson_progress;
create policy sonorum_scores_own on public.sonorum_scores for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy sonorum_progress_own on public.sonorum_lesson_progress for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
commit;

-- FIM 03_partituras_e_progresso.sql