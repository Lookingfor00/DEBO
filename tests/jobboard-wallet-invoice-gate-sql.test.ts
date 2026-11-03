import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../docs/sql/008_jobboard_wallet_invoice_gate.sql",
  ),
  "utf8",
);

describe("008_jobboard_wallet_invoice_gate.sql", () => {
  it("adds last_confirmed_reference and credited_at columns", () => {
    expect(sql).toMatch(
      /alter table jobboard\.wallets[\s\S]*last_confirmed_reference text/i,
    );
    expect(sql).toMatch(
      /alter table jobboard\.payment_events[\s\S]*credited_at timestamptz/i,
    );
  });

  it("replaces ingest_sms to match without crediting balance", () => {
    expect(sql).toMatch(/create or replace function jobboard\.ingest_sms\s*\(/i);
    expect(sql).toContain("'matched'");
    expect(sql).not.toMatch(
      /if v_auth0_sub is not null then[\s\S]*balance_xof = balance_xof \+ p_amount_xof/i,
    );
    expect(sql).toContain("confirm_wallet_invoice");
  });

  it("defines confirm_wallet_invoice RPC that credits and stores reference", () => {
    expect(sql).toMatch(
      /create or replace function jobboard\.confirm_wallet_invoice\s*\(/i,
    );
    expect(sql).toContain("p_auth0_sub");
    expect(sql).toContain("p_reference");
    expect(sql).toMatch(/security definer/i);
    expect(sql).toContain("credited_at is null");
    expect(sql).toContain("last_confirmed_reference");
    expect(sql).toContain("balance_xof = balance_xof + v_event.amount_xof");
    expect(sql).toContain("reference_not_found");
    expect(sql).toMatch(
      /grant execute on function jobboard\.confirm_wallet_invoice\(text, text\) to jobboard_app/i,
    );
    expect(sql).toMatch(
      /grant execute on function jobboard\.confirm_wallet_invoice\(text, text\) to service_role/i,
    );
    expect(sql).not.toMatch(/grant\s+[\w,\s]+\s+to\s+anon\b/i);
  });

  it("does not alter or drop engine tables", () => {
    expect(sql).not.toMatch(/\balter\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\bdrop\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\b(alter|drop)\b.{0,80}pipeline_/i);
  });
});
