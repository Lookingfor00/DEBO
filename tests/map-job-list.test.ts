import { describe, expect, it } from "vitest";

import { mapJobListItem } from "@/lib/mappers/map-job-list";
import type { PublicJobDto } from "@/lib/api/types";

const dto: PublicJobDto = {
  id: "abc",
  source_url: "https://ex.com/1",
  title: "Dev",
  company: "Acme",
  location: "Paris",
  publish_at: "2026-01-01",
  description_md: "body",
  external_id: "1",
  deadline: null,
};

describe("mapJobListItem", () => {
  it("maps DTO to list row with detail href", () => {
    expect(mapJobListItem(dto)).toEqual({
      id: "abc",
      title: "Dev",
      company: "Acme",
      location: "Paris",
      publishAt: "2026-01-01",
      href: "/jobs/abc",
    });
  });
});
