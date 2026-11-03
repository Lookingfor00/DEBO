import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("jobboard scaffold", () => {
  it("does not expose JOBS_READ_KEY as NEXT_PUBLIC", () => {
    const envExample = readFileSync(join(root, ".env.example"), "utf8");
    expect(envExample).toMatch(/^JOBS_READ_KEY=/m);
    expect(envExample).not.toMatch(/NEXT_PUBLIC_JOBS_READ_KEY/);
    expect(envExample).toMatch(/never.*SCRAPER_RUN_KEY/i);
  });
});
