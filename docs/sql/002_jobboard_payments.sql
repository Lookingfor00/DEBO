-- PI-001: jobboard wallets, payment methods/regex, events, ingest_sms (S0, S2, S4, S5, S10, S11, S12).
-- Apply on instance ai-scrapper only. Engine tables stay in AI-scrapper/worker/sql/.
-- Ops: create a Supabase Auth user with app_metadata.role = payment_ingest for the operator phone.
-- Never put service_role on the phone / APK.

create schema if not exists jobboard;

create table if not exists jobboard.wallets (
  id uuid primary key default gen_random_uuid(),
  auth0_sub text not null unique,
  payer_msisdn text not null unique,
  balance_xof bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobboard.payment_methods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  merchant_msisdn text,
  identify_regex text not null,
  amount_regex text not null,
  reference_regex text not null,
  sender_regex text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobboard.payment_events (
  id uuid primary key default gen_random_uuid(),
  method_id uuid references jobboard.payment_methods (id) on delete set null,
  raw_body text not null,
  sender_msisdn text,
  amount_xof bigint,
  reference text,
  auth0_sub text,
  status text not null,
  created_at timestamptz not null default now(),
  constraint payment_events_status_check
    check (status in ('matched', 'unmatched', 'parse_failed', 'duplicate'))
);

create unique index if not exists payment_events_matched_ref_uidx
  on jobboard.payment_events (method_id, reference)
  where status = 'matched' and reference is not null;

alter table jobboard.wallets enable row level security;
alter table jobboard.wallets force row level security;
alter table jobboard.payment_methods enable row level security;
alter table jobboard.payment_methods force row level security;
alter table jobboard.payment_events enable row level security;
alter table jobboard.payment_events force row level security;

drop policy if exists wallets_owner on jobboard.wallets;
create policy wallets_owner
  on jobboard.wallets
  for all
  using (auth0_sub = (auth.jwt() ->> 'sub'))
  with check (auth0_sub = (auth.jwt() ->> 'sub'));

drop policy if exists wallets_jobboard_app on jobboard.wallets;
create policy wallets_jobboard_app
  on jobboard.wallets
  for all
  to jobboard_app
  using (true)
  with check (true);

drop policy if exists payment_methods_ingest on jobboard.payment_methods;
create policy payment_methods_ingest
  on jobboard.payment_methods
  for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'payment_ingest')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'payment_ingest');

drop policy if exists payment_methods_jobboard_app on jobboard.payment_methods;
create policy payment_methods_jobboard_app
  on jobboard.payment_methods
  for select
  to jobboard_app
  using (true);

drop policy if exists payment_events_ingest on jobboard.payment_events;
create policy payment_events_ingest
  on jobboard.payment_events
  for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'payment_ingest')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'payment_ingest');

drop policy if exists payment_events_owner_select on jobboard.payment_events;
create policy payment_events_owner_select
  on jobboard.payment_events
  for select
  using (auth0_sub = (auth.jwt() ->> 'sub'));

drop policy if exists payment_events_jobboard_app on jobboard.payment_events;
create policy payment_events_jobboard_app
  on jobboard.payment_events
  for select
  to jobboard_app
  using (true);

create or replace function jobboard.ingest_sms(
  p_raw_body text,
  p_method_id uuid,
  p_sender_msisdn text,
  p_amount_xof bigint,
  p_reference text
) returns jsonb
language plpgsql
security definer
set search_path = jobboard, pg_temp
as $$
declare
  v_event_id uuid;
  v_auth0_sub text;
  v_balance bigint;
  v_dup uuid;
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'payment_ingest' then
    raise exception 'not ingest' using errcode = '42501';
  end if;

  if p_method_id is null or p_amount_xof is null then
    insert into payment_events (
      method_id, raw_body, sender_msisdn, amount_xof, reference, auth0_sub, status
    ) values (
      p_method_id, coalesce(p_raw_body, ''), p_sender_msisdn, p_amount_xof, p_reference, null, 'parse_failed'
    )
    returning id into v_event_id;
    return jsonb_build_object(
      'status', 'parse_failed',
      'event_id', v_event_id,
      'auth0_sub', null,
      'balance_xof', null
    );
  end if;

  if p_reference is not null then
    select id into v_dup
    from payment_events
    where method_id = p_method_id
      and reference = p_reference
      and status = 'matched'
    limit 1;
    if v_dup is not null then
      insert into payment_events (
        method_id, raw_body, sender_msisdn, amount_xof, reference, auth0_sub, status
      ) values (
        p_method_id, coalesce(p_raw_body, ''), p_sender_msisdn, p_amount_xof, p_reference, null, 'duplicate'
      )
      returning id into v_event_id;
      return jsonb_build_object(
        'status', 'duplicate',
        'event_id', v_event_id,
        'auth0_sub', null,
        'balance_xof', null
      );
    end if;
  end if;

  select auth0_sub, balance_xof
    into v_auth0_sub, v_balance
  from wallets
  where payer_msisdn = p_sender_msisdn;

  if v_auth0_sub is not null then
    update wallets
    set
      balance_xof = balance_xof + p_amount_xof,
      updated_at = now()
    where payer_msisdn = p_sender_msisdn
    returning auth0_sub, balance_xof into v_auth0_sub, v_balance;

    insert into payment_events (
      method_id, raw_body, sender_msisdn, amount_xof, reference, auth0_sub, status
    ) values (
      p_method_id, coalesce(p_raw_body, ''), p_sender_msisdn, p_amount_xof, p_reference, v_auth0_sub, 'matched'
    )
    returning id into v_event_id;
    return jsonb_build_object(
      'status', 'matched',
      'event_id', v_event_id,
      'auth0_sub', v_auth0_sub,
      'balance_xof', v_balance
    );
  end if;

  insert into payment_events (
    method_id, raw_body, sender_msisdn, amount_xof, reference, auth0_sub, status
  ) values (
    p_method_id, coalesce(p_raw_body, ''), p_sender_msisdn, p_amount_xof, p_reference, null, 'unmatched'
  )
  returning id into v_event_id;
  return jsonb_build_object(
    'status', 'unmatched',
    'event_id', v_event_id,
    'auth0_sub', null,
    'balance_xof', null
  );
end;
$$;

revoke all on function jobboard.ingest_sms(text, uuid, text, bigint, text) from public, anon;

grant usage on schema jobboard to jobboard_app;
grant select, insert, update on table jobboard.wallets to jobboard_app;
grant select on table jobboard.payment_methods to jobboard_app;
grant select on table jobboard.payment_events to jobboard_app;

grant usage on schema jobboard to authenticated;
grant select, insert, update, delete on table jobboard.payment_methods to authenticated;
grant select, insert on table jobboard.payment_events to authenticated;
grant execute on function jobboard.ingest_sms(text, uuid, text, bigint, text) to authenticated;

insert into jobboard.payment_methods (
  slug,
  display_name,
  merchant_msisdn,
  identify_regex,
  amount_regex,
  reference_regex,
  sender_regex,
  enabled
) values
  (
    'orange_money',
    'Orange Money',
    null,
    'Orange Money',
    '([0-9]+)',
    'ref',
    '([0-9]{8,})',
    false
  ),
  (
    'moov',
    'Moov',
    null,
    'Moov',
    '([0-9]+)',
    'ref',
    '([0-9]{8,})',
    false
  )
on conflict (slug) do nothing;

-- Placeholder methods stay off until PI-003 fixtures lock real regexes.
update jobboard.payment_methods
set enabled = false
where slug in ('orange_money', 'moov');
