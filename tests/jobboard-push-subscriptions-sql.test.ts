import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../docs/sql/010_jobboard_push_subscriptions.sql",
  ),
  "utf8",
);

describe("010_jobboard_push_subscriptions.sql", () => {
  it("creates push_subscriptions and push_sent with phone_activation FK", () => {
    expect(sql).toContain("jobboard.push_subscriptions");
    expect(sql).toContain("jobboard.push_sent");
    expect(sql).toContain("endpoint text not null unique");
    expect(sql).toContain("p256dh text not null");
    expect(sql).toContain("auth text not null");
    expect(sql).toMatch(
      /phone_activation_id uuid not null[\s\S]*references jobboard\.phone_activations/,
    );
    expect(sql).toMatch(
      /primary key \(subscription_id, item_id\)/,
    );
  });

  it("enables forced RLS without anon grants or engine table changes", () => {
    expect(sql).toMatch(/push_subscriptions enable row level security/);
    expect(sql).toMatch(/push_subscriptions force row level security/);
    expect(sql).toMatch(/push_sent enable row level security/);
    expect(sql).toMatch(/push_sent force row level security/);
    expect(sql).toContain(
      "grant select, insert, update, delete on table jobboard.push_subscriptions",
    );
    expect(sql).toContain(
      "grant select, insert, update, delete on table jobboard.push_sent",
    );
    expect(sql).toContain("to service_role");
    expect(sql).toContain("to jobboard_app");
    expect(sql).not.toMatch(/grant\s+[\w,\s]+\s+to\s+anon\b/i);
    expect(sql).not.toMatch(/\balter\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\b(alter|drop)\b.{0,80}pipeline_/i);
  });
});
