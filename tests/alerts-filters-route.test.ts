import { beforeEach, describe, expect, it, vi } from "vitest";

const getAlertsSession = vi.fn();
const putAlertFilters = vi.fn();

vi.mock("@/lib/alerts/session", () => ({
  getAlertsSession: (...args: unknown[]) => getAlertsSession(...args),
}));

vi.mock("@/lib/api/alert-filters", () => ({
  putAlertFilters: (...args: unknown[]) => putAlertFilters(...args),
}));

describe("POST/PUT /api/alerts/filters", () => {
  beforeEach(() => {
    getAlertsSession.mockReset();
    putAlertFilters.mockReset();
  });

  it("rejects JSON without alerts session", async () => {
    getAlertsSession.mockResolvedValue(null);
    const { PUT } = await import("@/app/api/alerts/filters/route");
    const response = await PUT(
      new Request("http://jobboard.test/api/alerts/filters", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keywords: "dev" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(putAlertFilters).not.toHaveBeenCalled();
  });

  it("saves keywords from session and ignores client phone_activation_id", async () => {
    getAlertsSession.mockResolvedValue({
      phoneActivationId: "phone-1",
      msisdn: "22372148718",
    });
    putAlertFilters.mockResolvedValue({ keywords: "dev" });
    const { PUT } = await import("@/app/api/alerts/filters/route");
    const response = await PUT(
      new Request("http://jobboard.test/api/alerts/filters", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          keywords: "dev",
          phone_activation_id: "phone-attacker",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(putAlertFilters).toHaveBeenCalledWith("phone-1", "dev");
    await expect(response.json()).resolves.toEqual({ keywords: "dev" });
  });

  it("form POST redirects to /alerts?saved=1", async () => {
    getAlertsSession.mockResolvedValue({
      phoneActivationId: "phone-1",
      msisdn: "22372148718",
    });
    putAlertFilters.mockResolvedValue({ keywords: "java" });
    const { POST } = await import("@/app/api/alerts/filters/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/filters", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          keywords: "java",
          phone_activation_id: "evil",
        }),
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://jobboard.test/alerts?saved=1",
    );
    expect(putAlertFilters).toHaveBeenCalledWith("phone-1", "java");
  });
});
