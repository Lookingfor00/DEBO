import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import {
  jobListFiltersFixture,
  jobListItemFixture,
} from "@/components/jobs/fixtures";
import { JobListView } from "@/components/jobs/job-list-view";

describe("JobListView", () => {
  it("renders a row linking to /jobs/<id>", () => {
    const html = renderToStaticMarkup(
      createElement(JobListView, {
        items: [jobListItemFixture],
        total: 1,
        filters: jobListFiltersFixture,
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("/jobs/abc");
    expect(html).toContain("Développeur");
    expect(html).toContain('action="/jobs"');
  });

  it("paginates with /jobs offset links", () => {
    const html = renderToStaticMarkup(
      createElement(JobListView, {
        items: [jobListItemFixture],
        total: 40,
        filters: jobListFiltersFixture,
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain('href="/jobs?offset=20"');
    expect(html).toContain("Suivant");
  });
});
