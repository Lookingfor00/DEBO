import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../docs/sql/002_jobboard_payments.sql",
  ),
  "utf8",
);

describe("002_jobboard_payments.sql", () => {
  it("creates wallets, payment_methods, and payment_events in schema jobboard", () => {
    expect(sql).toContain("create schema if not exists jobboard");
    expect(sql).toContain("jobboard.wallets");
    expect(sql).toContain("jobboard.payment_methods");
    expect(sql).toContain("jobboard.payment_events");
    expect(sql).toMatch(/auth0_sub text not null unique/);
    expect(sql).toMatch(/payer_msisdn text not null unique/);
    expect(sql).toMatch(/balance_xof bigint not null default 0/);
    expect(sql).toContain("identify_regex");
    expect(sql).toContain("amount_regex");
    expect(sql).toContain("reference_regex");
    expect(sql).toContain("sender_regex");
    expect(sql).toContain("merchant_msisdn");
  });

  it("defines ingest_sms RPC with parse_failed, duplicate, matched, unmatched", () => {
    expect(sql).toMatch(/create or replace function jobboard\.ingest_sms\s*\(/i);
    expect(sql).toContain("p_raw_body");
    expect(sql).toContain("p_method_id");
    expect(sql).toContain("p_sender_msisdn");
    expect(sql).toContain("p_amount_xof");
    expect(sql).toContain("p_reference");
    expect(sql).toMatch(/returns jsonb/i);
    expect(sql).toMatch(/security definer/i);
    expect(sql).toContain("payment_ingest");
    expect(sql).toContain("parse_failed");
    expect(sql).toContain("duplicate");
    expect(sql).toContain("'matched'");
    expect(sql).toContain("unmatched");
  });

  it("enables RLS, seeds placeholder methods, and grants jobboard_app without anon or wallet updates for authenticated", () => {
    expect(sql).toMatch(/enable row level security/);
    expect(sql).toMatch(/force row level security/);
    expect(sql).toContain("auth0_sub = (auth.jwt() ->> 'sub')");
    expect(sql).toContain("orange_money");
    expect(sql).toContain("moov");
    expect(sql).toMatch(/enabled\s*=\s*false/i);
    expect(sql).toMatch(/grant select, insert, update on table jobboard\.wallets to jobboard_app/i);
    expect(sql).toMatch(/grant select on table jobboard\.payment_methods to jobboard_app/i);
    expect(sql).toMatch(/grant select on table jobboard\.payment_events to jobboard_app/i);
    expect(sql).not.toMatch(/grant\s+update\s+on table jobboard\.wallets to authenticated/i);
    expect(sql).not.toMatch(/drop table\s+jobboard\.favorites/i);
  });

  it("does not alter or drop engine tables and does not grant anon", () => {
    expect(sql).not.toMatch(/\balter\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\bdrop\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\b(alter|drop)\b.{0,80}pipeline_/i);
    expect(sql).not.toMatch(/grant\s+[\w,\s]+\s+to\s+anon\b/i);
  });
});
