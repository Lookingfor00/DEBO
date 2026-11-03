import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { alertsMatchedJobsFixture } from "@/components/alerts/fixtures";
import { AlertsView } from "@/components/alerts/alerts-view";

describe("AlertsView", () => {
  it("gates with activate form when not activated", () => {
    const html = renderToStaticMarkup(
      createElement(AlertsView, {
        isActivated: false,
        msisdn: null,
        keywords: "",
        items: [],
        total: 0,
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("Alertes");
    expect(html).toContain('action="/api/alerts/activate"');
    expect(html).toContain('name="msisdn"');
    expect(html).toContain('name="code"');
    expect(html).not.toContain('action="/api/alerts/filters"');
    expect(html).not.toContain("Offres correspondantes");
  });

  it("shows keywords form and matched jobs when activated", () => {
    const html = renderToStaticMarkup(
      createElement(AlertsView, {
        isActivated: true,
        msisdn: "22372148718",
        keywords: "développeur",
        items: alertsMatchedJobsFixture,
        total: 1,
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("22372148718");
    expect(html).toContain('action="/api/alerts/filters"');
    expect(html).toContain('name="keywords"');
    expect(html).toContain("Offres correspondantes");
    expect(html).toContain("Développeur React");
    expect(html).toContain('href="/jobs/job-1"');
    expect(html).not.toContain('action="/api/alerts/activate"');
  });

  it("prompts for keywords when filter is empty", () => {
    const html = renderToStaticMarkup(
      createElement(AlertsView, {
        isActivated: true,
        msisdn: "22372148718",
        keywords: "",
        items: [],
        total: 0,
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("Ajoutez des mots-clés");
  });
});
