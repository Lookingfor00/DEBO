import { beforeEach, describe, expect, it, vi } from "vitest";

const getAlertFilters = vi.fn();
const listJobs = vi.fn();

vi.mock("@/lib/api/alert-filters", () => ({
  getAlertFilters: (...args: unknown[]) => getAlertFilters(...args),
}));

vi.mock("@/lib/api/jobs", () => ({
  listJobs: (...args: unknown[]) => listJobs(...args),
}));

describe("loadAlertsPage", () => {
  beforeEach(() => {
    getAlertFilters.mockReset();
    listJobs.mockReset();
  });

  it("does not call listJobs when keywords are blank", async () => {
    getAlertFilters.mockResolvedValue({ keywords: "  " });
    const { loadAlertsPage } = await import("@/hooks/pages/load-alerts-page");
    const state = await loadAlertsPage("phone-1", "22372148718");
    expect(listJobs).not.toHaveBeenCalled();
    expect(state.data.items).toEqual([]);
    expect(state.data.keywords).toBe("");
  });

  it("loads matched jobs with q only (no project)", async () => {
    getAlertFilters.mockResolvedValue({ keywords: "react bamako" });
    listJobs.mockResolvedValue({
      items: [
        {
          id: "job-1",
          source_url: null,
          title: "Dev",
          company: "Co",
          location: "Bamako",
          publish_at: null,
          description_md: null,
          external_id: null,
          deadline: null,
        },
      ],
      total: 1,
    });
    const { loadAlertsPage } = await import("@/hooks/pages/load-alerts-page");
    const state = await loadAlertsPage("phone-1", "22372148718");
    expect(listJobs).toHaveBeenCalledWith({ q: "react bamako", limit: 20 });
    const call = listJobs.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).not.toHaveProperty("project");
    expect(state.data.items[0]?.href).toBe("/jobs/job-1");
    expect(state.data.total).toBe(1);
  });
});
