import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../docs/sql/007_jobboard_alerts_activation.sql",
  ),
  "utf8",
);

describe("007_jobboard_alerts_activation.sql", () => {
  it("creates activation_codes, phone_activations, and alert_filters", () => {
    expect(sql).toContain("jobboard.activation_codes");
    expect(sql).toContain("jobboard.phone_activations");
    expect(sql).toContain("jobboard.alert_filters");
    expect(sql).toContain("code_hash text not null unique");
    expect(sql).toMatch(/status in \('available', 'used', 'invalidated'\)/);
    expect(sql).toContain("purchaser_auth0_sub text");
    expect(sql).toContain("purchaser_msisdn text");
    expect(sql).toContain("keywords text not null default ''");
    expect(sql).toMatch(
      /activation_code_id uuid not null unique[\s\S]*references jobboard\.activation_codes/,
    );
    expect(sql).toMatch(
      /phone_activation_id uuid not null unique[\s\S]*references jobboard\.phone_activations/,
    );
  });

  it("enables forced RLS without anon grants or engine table changes", () => {
    expect(sql).toMatch(/activation_codes enable row level security/);
    expect(sql).toMatch(/activation_codes force row level security/);
    expect(sql).toMatch(/phone_activations enable row level security/);
    expect(sql).toMatch(/phone_activations force row level security/);
    expect(sql).toMatch(/alert_filters enable row level security/);
    expect(sql).toMatch(/alert_filters force row level security/);
    expect(sql).toContain("grant select, insert, update on table jobboard.activation_codes to jobboard_app");
    expect(sql).toContain("grant select, insert, update on table jobboard.activation_codes to service_role");
    expect(sql).not.toMatch(/grant\s+[\w,\s]+\s+to\s+anon\b/i);
    expect(sql).not.toMatch(/\balter\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\bdrop\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\b(alter|drop)\b.{0,80}pipeline_/i);
  });
});
