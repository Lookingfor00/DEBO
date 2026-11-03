import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function collectSource(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "ui" && dir.endsWith("components")) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSource(full, acc);
      continue;
    }
    if (/\.(tsx|ts|css)$/.test(entry.name)) {
      acc.push(readFileSync(full, "utf8"));
    }
  }
  return acc;
}

describe("Debo caramel theme", () => {
  it("maps shadcn tokens to Debo caramel hexes", () => {
    const css = readFileSync(join(root, "app/globals.css"), "utf8");
    expect(css).toContain("#803D3B");
    expect(css).toContain("#5D3E30");
    expect(css).toContain("#F1E1CE");
    expect(css).toContain("#FAF4EC");
    expect(css).toContain("#EBE0E0");
  });

  it("does not use FitApp blue-violet in app or feature components", () => {
    const sources = [
      ...collectSource(join(root, "app")),
      ...collectSource(join(root, "components")),
    ].join("\n");
    expect(sources).not.toContain("#4294E3");
    expect(sources).not.toContain("#8F12FD");
  });
});
