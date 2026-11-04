import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const listPushSubscriptionsWithKeywords = vi.fn();
const deletePushSubscriptionById = vi.fn();
const listJobs = vi.fn();
const hasPushSent = vi.fn();
const markPushSent = vi.fn();
const sendJobAlert = vi.fn();

vi.mock("@/lib/api/push-subscriptions", () => ({
  listPushSubscriptionsWithKeywords: (...args: unknown[]) =>
    listPushSubscriptionsWithKeywords(...args),
  deletePushSubscriptionById: (...args: unknown[]) =>
    deletePushSubscriptionById(...args),
}));

vi.mock("@/lib/api/jobs", () => ({
  listJobs: (...args: unknown[]) => listJobs(...args),
}));

vi.mock("@/lib/api/push-sent", () => ({
  hasPushSent: (...args: unknown[]) => hasPushSent(...args),
  markPushSent: (...args: unknown[]) => markPushSent(...args),
}));

vi.mock("@/lib/push/web-push", () => ({
  sendJobAlert: (...args: unknown[]) => sendJobAlert(...args),
  isGoneStatus: (code: number) => code === 404 || code === 410,
}));

describe("runPushDispatch", () => {
  beforeEach(() => {
    listPushSubscriptionsWithKeywords.mockReset();
    deletePushSubscriptionById.mockReset();
    listJobs.mockReset();
    hasPushSent.mockReset();
    markPushSent.mockReset();
    sendJobAlert.mockReset();
  });

  it("skips already-sent items and does not resend", async () => {
    listPushSubscriptionsWithKeywords.mockResolvedValue([
      {
        id: "sub-1",
        phone_activation_id: "phone-1",
        endpoint: "https://push.example/1",
        p256dh: "p",
        auth: "a",
        keywords: "dev",
      },
    ]);
    listJobs.mockResolvedValue({
      items: [
        {
          id: "job-1",
          title: "Dev",
          source_url: null,
          company: null,
          location: null,
          publish_at: "2026-01-01",
          description_md: null,
          external_id: null,
          deadline: null,
        },
      ],
      total: 1,
    });
    hasPushSent.mockResolvedValue(true);

    const { runPushDispatch } = await import("@/lib/api/push-dispatch");
    const result = await runPushDispatch();
    expect(result).toEqual({
      scanned: 1,
      sent: 0,
      skipped: 1,
      errors: 0,
    });
    expect(sendJobAlert).not.toHaveBeenCalled();
    expect(markPushSent).not.toHaveBeenCalled();
  });

  it("does not list jobs when no keyworded subscriptions", async () => {
    listPushSubscriptionsWithKeywords.mockResolvedValue([]);
    const { runPushDispatch } = await import("@/lib/api/push-dispatch");
    const result = await runPushDispatch();
    expect(result.scanned).toBe(0);
    expect(listJobs).not.toHaveBeenCalled();
  });
});
