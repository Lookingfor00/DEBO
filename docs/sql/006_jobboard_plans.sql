-- PI-009: jobboard plans + subscriptions + purchase_plan RPC.
-- Apply on instance ai-scrapper after 001–005.
-- Visitors never INSERT/UPDATE plans. Renew: extend ends_at from max(now(), ends_at).

create table if not exists jobboard.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  price_xof bigint not null,
  duration_days int not null default 30,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_price_nonneg check (price_xof >= 0),
  constraint plans_duration_positive check (duration_days > 0)
);

create table if not exists jobboard.subscriptions (
  id uuid primary key default gen_random_uuid(),
  auth0_sub text not null unique,
  plan_id uuid not null references jobboard.plans (id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_ends_after_starts check (ends_at > starts_at)
);

alter table jobboard.plans enable row level security;
alter table jobboard.plans force row level security;
alter table jobboard.subscriptions enable row level security;
alter table jobboard.subscriptions force row level security;

drop policy if exists plans_jobboard_app on jobboard.plans;
create policy plans_jobboard_app
  on jobboard.plans
  for select
  to jobboard_app
  using (true);

drop policy if exists plans_service_role on jobboard.plans;
create policy plans_service_role
  on jobboard.plans
  for select
  to service_role
  using (true);

drop policy if exists subscriptions_owner on jobboard.subscriptions;
create policy subscriptions_owner
  on jobboard.subscriptions
  for all
  using (auth0_sub = (auth.jwt() ->> 'sub'))
  with check (auth0_sub = (auth.jwt() ->> 'sub'));

drop policy if exists subscriptions_jobboard_app on jobboard.subscriptions;
create policy subscriptions_jobboard_app
  on jobboard.subscriptions
  for all
  to jobboard_app
  using (true)
  with check (true);

drop policy if exists subscriptions_service_role on jobboard.subscriptions;
create policy subscriptions_service_role
  on jobboard.subscriptions
  for all
  to service_role
  using (true)
  with check (true);

create or replace function jobboard.purchase_plan(
  p_auth0_sub text,
  p_plan_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = jobboard, pg_temp
as $$
declare
  v_plan record;
  v_wallet record;
  v_sub record;
  v_now timestamptz := now();
  v_base timestamptz;
  v_ends timestamptz;
  v_starts timestamptz;
  v_balance bigint;
begin
  if p_auth0_sub is null or btrim(p_auth0_sub) = '' then
    return jsonb_build_object('error', 'auth0_sub_required');
  end if;
  if p_plan_id is null then
    return jsonb_build_object('error', 'plan_not_found');
  end if;

  select id, slug, display_name, price_xof, duration_days, enabled
  into v_plan
  from plans
  where id = p_plan_id
    and enabled = true
  for share;

  if v_plan.id is null then
    return jsonb_build_object('error', 'plan_not_found');
  end if;

  select id, auth0_sub, balance_xof
  into v_wallet
  from wallets
  where auth0_sub = p_auth0_sub
  for update;

  if v_wallet.id is null then
    return jsonb_build_object('error', 'insufficient_balance');
  end if;

  if v_wallet.balance_xof < v_plan.price_xof then
    return jsonb_build_object('error', 'insufficient_balance');
  end if;

  v_balance := v_wallet.balance_xof - v_plan.price_xof;
  update wallets
  set balance_xof = v_balance,
      updated_at = v_now
  where id = v_wallet.id;

  select id, starts_at, ends_at
  into v_sub
  from subscriptions
  where auth0_sub = p_auth0_sub
  for update;

  if v_sub.id is null then
    v_starts := v_now;
    v_ends := v_now + make_interval(days => v_plan.duration_days);
    insert into subscriptions (auth0_sub, plan_id, starts_at, ends_at)
    values (p_auth0_sub, v_plan.id, v_starts, v_ends)
    returning id, auth0_sub, plan_id, starts_at, ends_at into v_sub;
  else
    v_base := greatest(v_now, v_sub.ends_at);
    v_ends := v_base + make_interval(days => v_plan.duration_days);
    v_starts := v_sub.starts_at;
    update subscriptions
    set plan_id = v_plan.id,
        ends_at = v_ends,
        updated_at = v_now
    where id = v_sub.id
    returning id, auth0_sub, plan_id, starts_at, ends_at into v_sub;
  end if;

  return jsonb_build_object(
    'balance_xof', v_balance,
    'subscription', jsonb_build_object(
      'id', v_sub.id,
      'auth0_sub', v_sub.auth0_sub,
      'plan_id', v_sub.plan_id,
      'starts_at', v_sub.starts_at,
      'ends_at', v_sub.ends_at
    )
  );
end;
$$;

revoke all on function jobboard.purchase_plan(text, uuid) from public, anon;

grant select on table jobboard.plans to jobboard_app;
grant select, insert, update on table jobboard.subscriptions to jobboard_app;
grant execute on function jobboard.purchase_plan(text, uuid) to jobboard_app;

grant select on table jobboard.plans to service_role;
grant select, insert, update on table jobboard.subscriptions to service_role;
grant execute on function jobboard.purchase_plan(text, uuid) to service_role;

insert into jobboard.plans (
  slug,
  display_name,
  price_xof,
  duration_days,
  enabled
) values (
  'plan_de_test',
  'Plan de test',
  1000,
  30,
  true
)
on conflict (slug) do update
set
  display_name = excluded.display_name,
  price_xof = excluded.price_xof,
  duration_days = excluded.duration_days,
  enabled = excluded.enabled,
  updated_at = now();
