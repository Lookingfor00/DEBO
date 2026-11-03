import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { jobDetailFixture } from "@/components/jobs/fixtures";
import { JobDetailView } from "@/components/jobs/job-detail-view";

describe("JobDetailView", () => {
  it("renders markdown without raw HTML", () => {
    const html = renderToStaticMarkup(
      createElement(JobDetailView, { job: jobDetailFixture }),
    );
    expect(html).toContain("<h2>");
    expect(html).toContain("Mission");
    expect(html).not.toContain("dangerouslySetInnerHTML");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("links back to the list", () => {
    const html = renderToStaticMarkup(
      createElement(JobDetailView, { job: jobDetailFixture }),
    );
    expect(html).toContain('href="/jobs"');
  });
});
