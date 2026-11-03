import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../docs/sql/005_jobboard_service_role_grants.sql",
  ),
  "utf8",
);

describe("005_jobboard_service_role_grants.sql", () => {
  it("grants service_role schema usage and jobboard table privileges", () => {
    expect(sql).toMatch(/grant usage on schema jobboard to service_role/i);
    expect(sql).toMatch(
      /grant select, insert, delete on table jobboard\.favorites to service_role/i,
    );
    expect(sql).toMatch(
      /grant select, insert, update on table jobboard\.wallets to service_role/i,
    );
    expect(sql).toMatch(
      /grant select on table jobboard\.payment_methods to service_role/i,
    );
    expect(sql).toMatch(
      /grant select on table jobboard\.payment_events to service_role/i,
    );
  });

  it("does not grant anon", () => {
    expect(sql).not.toMatch(/grant\s+[\w,\s]+\s+to\s+anon\b/i);
  });
});
