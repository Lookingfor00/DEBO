-- TB-006: product schema jobboard.favorites (S4, S5, S10, S11, S12).
-- Apply on instance ai-scrapper only. Engine tables stay in AI-scrapper/worker/sql/.

create schema if not exists jobboard;

revoke all on schema jobboard from public, anon, authenticated;

create table if not exists jobboard.favorites (
  id uuid primary key default gen_random_uuid(),
  auth0_sub text not null,
  item_id uuid not null references public.items (id),
  created_at timestamptz not null default now(),
  unique (auth0_sub, item_id)
);

create index if not exists favorites_auth0_sub_idx
  on jobboard.favorites (auth0_sub);

alter table jobboard.favorites enable row level security;
alter table jobboard.favorites force row level security;

drop policy if exists favorites_owner on jobboard.favorites;

create policy favorites_owner
  on jobboard.favorites
  for all
  using (auth0_sub = (auth.jwt() ->> 'sub'))
  with check (auth0_sub = (auth.jwt() ->> 'sub'));

-- Restricted app role for DEBO Route Handlers (JOBBOARD_SECRET_KEY).
-- v1 still filters .eq('auth0_sub', session.sub) in Next (S5).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'jobboard_app') then
    create role jobboard_app nologin;
  end if;
end
$$;

grant usage on schema jobboard to jobboard_app;
grant select, insert, delete on table jobboard.favorites to jobboard_app;
