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
