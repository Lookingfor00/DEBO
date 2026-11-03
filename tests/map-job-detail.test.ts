import { describe, expect, it } from "vitest";

import { mapJobDetail } from "@/lib/mappers/map-job-detail";

describe("mapJobDetail", () => {
  it("maps dto fields to the detail view-model", () => {
    const vm = mapJobDetail({
      id: "abc",
      source_url: "https://ex.com/1",
      title: "Développeur",
      company: "Acme",
      location: "Paris",
      publish_at: "2026-01-01",
      description_md: "## Mission\nBuild",
      external_id: "ext-1",
      deadline: null,
    });
    expect(vm).toEqual({
      id: "abc",
      title: "Développeur",
      company: "Acme",
      location: "Paris",
      publishAt: "2026-01-01",
      sourceUrl: "https://ex.com/1",
      descriptionMd: "## Mission\nBuild",
    });
  });
});
