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
