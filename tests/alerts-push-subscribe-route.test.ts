import { beforeEach, describe, expect, it, vi } from "vitest";

const getAlertsSession = vi.fn();
const getAlertFilters = vi.fn();
const upsertPushSubscription = vi.fn();
const deletePushSubscription = vi.fn();

vi.mock("@/lib/alerts/session", () => ({
  getAlertsSession: (...args: unknown[]) => getAlertsSession(...args),
}));

vi.mock("@/lib/api/alert-filters", () => ({
  getAlertFilters: (...args: unknown[]) => getAlertFilters(...args),
}));

vi.mock("@/lib/api/push-subscriptions", () => ({
  upsertPushSubscription: (...args: unknown[]) =>
    upsertPushSubscription(...args),
  deletePushSubscription: (...args: unknown[]) =>
    deletePushSubscription(...args),
}));

const subBody = {
  endpoint: "https://push.example/abc",
  keys: { p256dh: "p256", auth: "authk" },
};

describe("POST /api/alerts/push-subscribe", () => {
  beforeEach(() => {
    getAlertsSession.mockReset();
    getAlertFilters.mockReset();
    upsertPushSubscription.mockReset();
  });

  it("rejects without alerts session", async () => {
    getAlertsSession.mockResolvedValue(null);
    const { POST } = await import("@/app/api/alerts/push-subscribe/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/push-subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subBody),
      }),
    );
    expect(response.status).toBe(401);
    expect(upsertPushSubscription).not.toHaveBeenCalled();
  });

  it("rejects when keywords are empty", async () => {
    getAlertsSession.mockResolvedValue({
      phoneActivationId: "phone-1",
      msisdn: "22370000000",
    });
    getAlertFilters.mockResolvedValue({ keywords: "  " });
    const { POST } = await import("@/app/api/alerts/push-subscribe/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/push-subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subBody),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "keywords_required",
    });
    expect(upsertPushSubscription).not.toHaveBeenCalled();
  });

  it("upserts subscription from session and ignores client phone_activation_id", async () => {
    getAlertsSession.mockResolvedValue({
      phoneActivationId: "phone-1",
      msisdn: "22370000000",
    });
    getAlertFilters.mockResolvedValue({ keywords: "dev" });
    upsertPushSubscription.mockResolvedValue({
      id: "sub-1",
      phone_activation_id: "phone-1",
      endpoint: subBody.endpoint,
      p256dh: "p256",
      auth: "authk",
    });
    const { POST } = await import("@/app/api/alerts/push-subscribe/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/push-subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...subBody,
          phone_activation_id: "attacker",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(upsertPushSubscription).toHaveBeenCalledWith({
      phoneActivationId: "phone-1",
      endpoint: subBody.endpoint,
      p256dh: "p256",
      auth: "authk",
    });
  });
});

describe("POST /api/alerts/push-unsubscribe", () => {
  beforeEach(() => {
    getAlertsSession.mockReset();
    deletePushSubscription.mockReset();
  });

  it("rejects without alerts session", async () => {
    getAlertsSession.mockResolvedValue(null);
    const { POST } = await import("@/app/api/alerts/push-unsubscribe/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/push-unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: subBody.endpoint }),
      }),
    );
    expect(response.status).toBe(401);
    expect(deletePushSubscription).not.toHaveBeenCalled();
  });

  it("deletes subscription for session phone", async () => {
    getAlertsSession.mockResolvedValue({
      phoneActivationId: "phone-1",
      msisdn: "22370000000",
    });
    deletePushSubscription.mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/alerts/push-unsubscribe/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/push-unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: subBody.endpoint,
          phone_activation_id: "evil",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(deletePushSubscription).toHaveBeenCalledWith({
      phoneActivationId: "phone-1",
      endpoint: subBody.endpoint,
    });
  });
});
