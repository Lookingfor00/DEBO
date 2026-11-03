import { beforeEach, describe, expect, it, vi } from "vitest";

const invalidateActivationCode = vi.fn();

vi.mock("@/lib/api/activation-codes", () => {
  class ActivationCodeError extends Error {
    readonly code: string;
    constructor(code: string) {
      super(code);
      this.name = "ActivationCodeError";
      this.code = code;
    }
  }
  return {
    ActivationCodeError,
    invalidateActivationCode: (...args: unknown[]) =>
      invalidateActivationCode(...args),
  };
});

describe("POST /api/alerts/invalidate", () => {
  beforeEach(() => {
    invalidateActivationCode.mockReset();
    process.env.ALERTS_INVALIDATE_SECRET = "invalidate-secret";
  });

  it("rejects missing or wrong bearer", async () => {
    const { POST } = await import("@/app/api/alerts/invalidate/route");
    const noAuth = await POST(
      new Request("http://jobboard.test/api/alerts/invalidate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: "ABC" }),
      }),
    );
    expect(noAuth.status).toBe(401);

    const wrong = await POST(
      new Request("http://jobboard.test/api/alerts/invalidate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer wrong",
        },
        body: JSON.stringify({ code: "ABC" }),
      }),
    );
    expect(wrong.status).toBe(401);
    expect(invalidateActivationCode).not.toHaveBeenCalled();
  });

  it("invalidates with the shared secret", async () => {
    invalidateActivationCode.mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/alerts/invalidate/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/invalidate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer invalidate-secret",
        },
        body: JSON.stringify({ code: "ABC" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(invalidateActivationCode).toHaveBeenCalledWith("ABC");
    await expect(response.json()).resolves.toEqual({ invalidated: true });
  });

  it("returns 404 when code is unknown", async () => {
    const { ActivationCodeError } = await import("@/lib/api/activation-codes");
    invalidateActivationCode.mockRejectedValue(
      new ActivationCodeError("code_not_found"),
    );
    const { POST } = await import("@/app/api/alerts/invalidate/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/invalidate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer invalidate-secret",
        },
        body: JSON.stringify({ code: "MISSING" }),
      }),
    );
    expect(response.status).toBe(404);
  });
});
