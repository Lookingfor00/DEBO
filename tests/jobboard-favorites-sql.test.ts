import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../docs/sql/001_jobboard_favorites.sql",
  ),
  "utf8",
);

describe("001_jobboard_favorites.sql", () => {
  it("creates jobboard.favorites with auth0_sub and RLS", () => {
    expect(sql).toContain("create schema if not exists jobboard");
    expect(sql).toContain("jobboard.favorites");
    expect(sql).toContain("auth0_sub text not null");
    expect(sql).toMatch(/unique \(auth0_sub, item_id\)/);
    expect(sql).toMatch(/enable row level security/);
    expect(sql).toMatch(/force row level security/);
    expect(sql).toContain("auth0_sub = (auth.jwt() ->> 'sub')");
  });

  it("does not alter or drop engine tables and does not grant anon", () => {
    expect(sql).not.toMatch(/\balter\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\bdrop\s+table\s+public\.(items|jobs)\b/i);
    expect(sql).not.toMatch(/\b(alter|drop)\b.{0,80}pipeline_/i);
    expect(sql).not.toMatch(/grant\s+[\w,\s]+\s+to\s+anon\b/i);
  });
});
