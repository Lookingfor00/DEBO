-- TB-023: Web Push subscriptions + send dedupe for alerts (S0, S4, S10, S11).
-- Apply on instance ai-scrapper only. Product SQL in DEBO/docs/sql/.
-- Alerts identity = phone_activation_id (not Auth0). No engine table writes.
-- Do not put VAPID private / ALERTS_PUSH_DISPATCH_SECRET in NEXT_PUBLIC_*.

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

create table if not exists jobboard.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  phone_activation_id uuid not null
    references jobboard.phone_activations (id),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_phone_activation_idx
  on jobboard.push_subscriptions (phone_activation_id);

create table if not exists jobboard.push_sent (
  subscription_id uuid not null
    references jobboard.push_subscriptions (id) on delete cascade,
  item_id uuid not null,
  sent_at timestamptz not null default now(),
  primary key (subscription_id, item_id)
);

create index if not exists push_sent_item_idx
  on jobboard.push_sent (item_id);

alter table jobboard.push_subscriptions enable row level security;
alter table jobboard.push_subscriptions force row level security;

alter table jobboard.push_sent enable row level security;
alter table jobboard.push_sent force row level security;

revoke all on table jobboard.push_subscriptions from public, anon, authenticated;
revoke all on table jobboard.push_sent from public, anon, authenticated;

grant select, insert, update, delete on table jobboard.push_subscriptions
  to jobboard_app;
grant select, insert, update, delete on table jobboard.push_sent
  to jobboard_app;

grant select, insert, update, delete on table jobboard.push_subscriptions
  to service_role;
grant select, insert, update, delete on table jobboard.push_sent
  to service_role;
