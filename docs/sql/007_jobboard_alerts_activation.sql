-- TB-017: activation codes, phone bindings, alert keyword filters (S0, S4, S5, S10, S11).
-- Apply on instance ai-scrapper only. No inbox table — V1 matches jobs on the fly (TB-021).
-- Alerts surface is phone+code (not Auth0 JWT). No policies for anon/authenticated.
-- DEBO Route Handlers (TB-019) use a privileged server client and filter explicitly (S5).
-- Do not put service_role / JOBBOARD_SECRET_KEY in NEXT_PUBLIC_*.

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

create table if not exists jobboard.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  status text not null
    check (status in ('available', 'used', 'invalidated')),
  purchaser_auth0_sub text,
  purchaser_msisdn text,
  used_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists jobboard.phone_activations (
  id uuid primary key default gen_random_uuid(),
  msisdn text not null,
  activation_code_id uuid not null unique
    references jobboard.activation_codes (id),
  activated_at timestamptz not null default now()
);

create index if not exists phone_activations_msisdn_idx
  on jobboard.phone_activations (msisdn);

create table if not exists jobboard.alert_filters (
  id uuid primary key default gen_random_uuid(),
  phone_activation_id uuid not null unique
    references jobboard.phone_activations (id),
  keywords text not null default '',
  updated_at timestamptz not null default now()
);

alter table jobboard.activation_codes enable row level security;
alter table jobboard.activation_codes force row level security;

alter table jobboard.phone_activations enable row level security;
alter table jobboard.phone_activations force row level security;

alter table jobboard.alert_filters enable row level security;
alter table jobboard.alert_filters force row level security;

-- No anon/authenticated policies: deny by default. Server role bypasses RLS.

grant select, insert, update on table jobboard.activation_codes to jobboard_app;
grant select, insert, update on table jobboard.phone_activations to jobboard_app;
grant select, insert, update on table jobboard.alert_filters to jobboard_app;

grant select, insert, update on table jobboard.activation_codes to service_role;
grant select, insert, update on table jobboard.phone_activations to service_role;
grant select, insert, update on table jobboard.alert_filters to service_role;
