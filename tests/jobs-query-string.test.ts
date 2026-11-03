import { describe, expect, it } from "vitest";

import { jobListFiltersFixture } from "@/components/jobs/fixtures";
import { jobListQueryString } from "@/lib/jobs-query-string";

describe("jobListQueryString", () => {
  it("uses /jobs as the list base path", () => {
    expect(jobListQueryString(jobListFiltersFixture)).toBe("/jobs");
    expect(
      jobListQueryString({ ...jobListFiltersFixture, q: "dev", offset: 20 }),
    ).toBe("/jobs?q=dev&offset=20");
  });
});
