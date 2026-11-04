-- Dual-pipeline analytics events (Clarity mirror). S0, S4, S11, S12.
-- Apply on instance ai-scrapper only. Product SQL lives in DEBO/docs/sql/.
-- Service-role ingest only via DEBO POST /api/track. No anon/authenticated policies.
-- No download_leads / admin views in this pass.

create schema if not exists jobboard;

revoke all on schema jobboard from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'jobboard_app') then
    create role jobboard_app nologin;
  end if;
end
$$;

grant usage on schema jobboard to jobboard_app;
grant usage on schema jobboard to service_role;

create table if not exists jobboard.analytics_events (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  client_ts timestamptz,
  event_name text not null check (char_length(event_name) <= 64),
  anon_id uuid,
  session_id uuid,
  path text check (char_length(path) <= 512),
  -- No FK on purpose: forged ids must not fail the batch
  item_id uuid,
  item_code text,
  category_id uuid,
  source text,
  referrer_domain text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  first_utm_source text,
  first_utm_medium text,
  first_utm_campaign text,
  device_type text,
  os text,
  browser text,
  connection_type text,
  language text,
  viewport_w int,
  viewport_h int,
  country text,
  region text,
  city text,
  is_returning boolean,
  visit_count int,
  properties jsonb not null default '{}'::jsonb
    check (pg_column_size(properties) <= 4096)
);

create index if not exists analytics_events_name_time_idx
  on jobboard.analytics_events (event_name, received_at desc);
create index if not exists analytics_events_item_idx
  on jobboard.analytics_events (item_id, event_name)
  where item_id is not null;
create index if not exists analytics_events_session_idx
  on jobboard.analytics_events (session_id);
create index if not exists analytics_events_anon_idx
  on jobboard.analytics_events (anon_id);
create index if not exists analytics_events_time_brin
  on jobboard.analytics_events using brin (received_at);

alter table jobboard.analytics_events enable row level security;
alter table jobboard.analytics_events force row level security;

revoke all on table jobboard.analytics_events from public, anon, authenticated;

grant select, insert on table jobboard.analytics_events to service_role;
grant select, insert on table jobboard.analytics_events to jobboard_app;

create or replace function jobboard.purge_old_analytics()
returns bigint
language sql
security definer
set search_path = jobboard, public
as $$
  with d as (
    delete from jobboard.analytics_events
    where received_at < now() - interval '25 months'
    returning 1
  )
  select count(*) from d;
$$;

revoke execute on function jobboard.purge_old_analytics()
  from public, anon, authenticated;
grant execute on function jobboard.purge_old_analytics() to service_role;
