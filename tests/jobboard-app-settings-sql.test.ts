import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../docs/sql/011_jobboard_app_settings.sql",
  ),
  "utf8",
);

describe("011_jobboard_app_settings.sql", () => {
  it("creates jobboard.app_settings with RLS and whatsapp seed off", () => {
    expect(sql).toContain("jobboard.app_settings");
    expect(sql).toContain("key text primary key");
    expect(sql).toContain("value jsonb not null");
    expect(sql).toMatch(/enable row level security/);
    expect(sql).toMatch(/force row level security/);
    expect(sql).toContain("whatsapp_copy_enabled");
    expect(sql).toMatch(/'false'::jsonb/);
    expect(sql).toMatch(/on conflict \(key\) do nothing/);
  });

  it("does not grant anon and does not touch engine tables", () => {
    expect(sql).not.toMatch(/grant\s+[\w,\s]+\s+to\s+anon\b/i);
    expect(sql).not.toMatch(/\balter\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\bdrop\s+table\s+public\.(items|jobs)\b/i);
  });
});
