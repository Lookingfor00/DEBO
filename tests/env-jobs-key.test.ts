import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("jobs env", () => {
  it("does not expose JOBS_READ_KEY to the client", () => {
    const example = readFileSync(join(root, ".env.example"), "utf8");
    expect(example).toContain("JOBS_READ_KEY=");
    expect(example).not.toContain("NEXT_PUBLIC_JOBS_READ_KEY");
  });

  it("keeps scrape secrets out of the job board source", () => {
    const files = [
      "lib/api/favorites.ts",
      "lib/api/jobboard-client.ts",
      "app/api/favorites/route.ts",
      "lib/auth0.ts",
      "middleware.ts",
    ];
    for (const file of files) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source, file).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
      expect(source, file).not.toMatch(/SCRAPER_RUN_KEY/);
    }
  });

  it("documents Auth0 and jobboard keys without scrape secrets", () => {
    const example = readFileSync(join(root, ".env.example"), "utf8");
    expect(example).toMatch(/^APP_BASE_URL=/m);
    expect(example).toMatch(/^AUTH0_SECRET=/m);
    expect(example).toMatch(/^JOBBOARD_SECRET_KEY=/m);
    expect(example).toMatch(/^SUPPORT_MSISDN=/m);
    expect(example).toMatch(/^ALERTS_SESSION_SECRET=/m);
    expect(example).toMatch(/^ALERTS_INVALIDATE_SECRET=/m);
    expect(example).not.toMatch(/^SUPABASE_SERVICE_ROLE_KEY=/m);
    expect(example).not.toMatch(/^SCRAPER_RUN_KEY=/m);
    expect(example).not.toMatch(/^NEXT_PUBLIC_AUTH0_SECRET=/m);
    expect(example).not.toMatch(/^NEXT_PUBLIC_JOBBOARD_SECRET_KEY=/m);
    expect(example).not.toMatch(/^NEXT_PUBLIC_SUPPORT_MSISDN=/m);
    expect(example).not.toMatch(/^NEXT_PUBLIC_ALERTS_SESSION_SECRET=/m);
    expect(example).not.toMatch(/^NEXT_PUBLIC_ALERTS_INVALIDATE_SECRET=/m);
  });
});


