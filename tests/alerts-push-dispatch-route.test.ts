import { beforeEach, describe, expect, it, vi } from "vitest";

const runPushDispatch = vi.fn();

vi.mock("@/lib/api/push-dispatch", () => ({
  runPushDispatch: (...args: unknown[]) => runPushDispatch(...args),
}));

describe("POST /api/alerts/push-dispatch", () => {
  beforeEach(() => {
    runPushDispatch.mockReset();
    process.env.ALERTS_PUSH_DISPATCH_SECRET = "dispatch-secret";
  });

  it("rejects wrong bearer", async () => {
    const { POST } = await import("@/app/api/alerts/push-dispatch/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/push-dispatch", {
        method: "POST",
        headers: { authorization: "Bearer nope" },
      }),
    );
    expect(response.status).toBe(401);
    expect(runPushDispatch).not.toHaveBeenCalled();
  });

  it("runs dispatch with valid secret", async () => {
    runPushDispatch.mockResolvedValue({
      scanned: 1,
      sent: 0,
      skipped: 2,
      errors: 0,
    });
    const { POST } = await import("@/app/api/alerts/push-dispatch/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/push-dispatch", {
        method: "POST",
        headers: { authorization: "Bearer dispatch-secret" },
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      scanned: 1,
      sent: 0,
      skipped: 2,
      errors: 0,
    });
  });
});
