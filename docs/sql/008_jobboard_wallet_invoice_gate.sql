-- TB-018: wallet credit only after user confirms SMS invoice reference (S4, S5, S10).
-- Apply on ai-scrapper after 002/005. Ingest no longer increments balance on match.
-- Front GET balance must pass last confirmed reference. Do not put secrets in NEXT_PUBLIC_*.

alter table jobboard.wallets
  add column if not exists last_confirmed_reference text;

alter table jobboard.payment_events
  add column if not exists credited_at timestamptz;

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
    -- Matched to a wallet but do NOT credit until confirm_wallet_invoice.
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

create or replace function jobboard.confirm_wallet_invoice(
  p_auth0_sub text,
  p_reference text
) returns jsonb
language plpgsql
security definer
set search_path = jobboard, pg_temp
as $$
declare
  v_wallet record;
  v_event record;
  v_balance bigint;
  v_ref text;
begin
  v_ref := nullif(btrim(coalesce(p_reference, '')), '');
  if p_auth0_sub is null or btrim(p_auth0_sub) = '' then
    return jsonb_build_object('error', 'auth0_sub_required');
  end if;
  if v_ref is null then
    return jsonb_build_object('error', 'reference_required');
  end if;

  select id, auth0_sub, payer_msisdn, balance_xof, last_confirmed_reference
    into v_wallet
  from wallets
  where auth0_sub = p_auth0_sub
  for update;

  if v_wallet.id is null then
    return jsonb_build_object('error', 'wallet_not_found');
  end if;

  select id, amount_xof, reference
    into v_event
  from payment_events
  where status = 'matched'
    and credited_at is null
    and reference = v_ref
    and sender_msisdn = v_wallet.payer_msisdn
  order by created_at asc
  limit 1
  for update;

  if v_event.id is null then
    return jsonb_build_object('error', 'reference_not_found');
  end if;

  if v_event.amount_xof is null then
    return jsonb_build_object('error', 'amount_missing');
  end if;

  update payment_events
  set credited_at = now()
  where id = v_event.id;

  update wallets
  set
    balance_xof = balance_xof + v_event.amount_xof,
    last_confirmed_reference = v_ref,
    updated_at = now()
  where id = v_wallet.id
  returning balance_xof into v_balance;

  return jsonb_build_object(
    'status', 'credited',
    'event_id', v_event.id,
    'auth0_sub', v_wallet.auth0_sub,
    'balance_xof', v_balance,
    'last_confirmed_reference', v_ref
  );
end;
$$;

revoke all on function jobboard.ingest_sms(text, uuid, text, bigint, text) from public, anon;
revoke all on function jobboard.confirm_wallet_invoice(text, text) from public, anon;

grant execute on function jobboard.confirm_wallet_invoice(text, text) to jobboard_app;
grant execute on function jobboard.confirm_wallet_invoice(text, text) to service_role;
grant execute on function jobboard.ingest_sms(text, uuid, text, bigint, text) to authenticated;
