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
