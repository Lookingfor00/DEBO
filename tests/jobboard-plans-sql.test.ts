import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../docs/sql/006_jobboard_plans.sql",
  ),
  "utf8",
);

describe("006_jobboard_plans.sql", () => {
  it("creates plans and subscriptions with seed plan_de_test", () => {
    expect(sql).toContain("jobboard.plans");
    expect(sql).toContain("jobboard.subscriptions");
    expect(sql).toMatch(/slug text not null unique/i);
    expect(sql).toMatch(/price_xof bigint not null/i);
    expect(sql).toMatch(/duration_days int not null default 30/i);
    expect(sql).toMatch(/auth0_sub text not null unique/i);
    expect(sql).toContain("plan_de_test");
    expect(sql).toContain("Plan de test");
    expect(sql).toMatch(/1000/);
  });

  it("defines purchase_plan RPC and grants without anon", () => {
    expect(sql).toMatch(/create or replace function jobboard\.purchase_plan\s*\(/i);
    expect(sql).toContain("p_auth0_sub");
    expect(sql).toContain("p_plan_id");
    expect(sql).toMatch(/security definer/i);
    expect(sql).toContain("insufficient_balance");
    expect(sql).toMatch(/grant select on table jobboard\.plans to jobboard_app/i);
    expect(sql).toMatch(
      /grant select, insert, update on table jobboard\.subscriptions to jobboard_app/i,
    );
    expect(sql).toMatch(/grant select on table jobboard\.plans to service_role/i);
    expect(sql).toMatch(
      /grant select, insert, update on table jobboard\.subscriptions to service_role/i,
    );
    expect(sql).toMatch(/grant execute on function jobboard\.purchase_plan/i);
    expect(sql).not.toMatch(/grant\s+[\w,\s]+\s+to\s+anon\b/i);
    expect(sql).not.toMatch(/grant\s+(insert|update|delete).{0,40}on table jobboard\.plans/i);
  });

  it("enables RLS and does not touch engine tables", () => {
    expect(sql).toMatch(/enable row level security/);
    expect(sql).toMatch(/force row level security/);
    expect(sql).not.toMatch(/\balter\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\bdrop\s+table\s+public\.(items|jobs)\b/i);
  });
});
