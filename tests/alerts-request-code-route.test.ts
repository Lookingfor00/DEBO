import { beforeEach, describe, expect, it, vi } from "vitest";

const getVisitorSession = vi.fn();
const requestActivationCode = vi.fn();

vi.mock("@/lib/auth0", () => ({
  getVisitorSession: (...args: unknown[]) => getVisitorSession(...args),
}));

vi.mock("@/lib/api/activation-codes", () => {
  class CodeAlreadyIssuedError extends Error {
    constructor() {
      super("code_already_issued");
      this.name = "CodeAlreadyIssuedError";
    }
  }
  class NoActiveSubscriptionError extends Error {
    constructor() {
      super("no_active_subscription");
      this.name = "NoActiveSubscriptionError";
    }
  }
  return {
    CodeAlreadyIssuedError,
    NoActiveSubscriptionError,
    requestActivationCode: (...args: unknown[]) =>
      requestActivationCode(...args),
  };
});

describe("POST /api/alerts/request-code", () => {
  beforeEach(() => {
    getVisitorSession.mockReset();
    requestActivationCode.mockReset();
  });

  it("rejects unauthenticated callers", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: false,
      displayName: null,
      sub: null,
    });
    const { POST } = await import("@/app/api/alerts/request-code/route");
    const response = await POST();
    expect(response.status).toBe(401);
    expect(requestActivationCode).not.toHaveBeenCalled();
  });

  it("returns plaintext code once", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    requestActivationCode.mockResolvedValue({
      code: "ABCD1234",
      id: "c1",
    });
    const { POST } = await import("@/app/api/alerts/request-code/route");
    const response = await POST();
    expect(response.status).toBe(200);
    expect(requestActivationCode).toHaveBeenCalledWith("auth0|alice");
    await expect(response.json()).resolves.toEqual({ code: "ABCD1234" });
  });

  it("returns 409 when a code was already issued", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    const { CodeAlreadyIssuedError } = await import(
      "@/lib/api/activation-codes"
    );
    requestActivationCode.mockRejectedValue(new CodeAlreadyIssuedError());
    const { POST } = await import("@/app/api/alerts/request-code/route");
    const response = await POST();
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "code_already_issued",
    });
  });

  it("returns 403 without an active subscription", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    const { NoActiveSubscriptionError } = await import(
      "@/lib/api/activation-codes"
    );
    requestActivationCode.mockRejectedValue(new NoActiveSubscriptionError());
    const { POST } = await import("@/app/api/alerts/request-code/route");
    const response = await POST();
    expect(response.status).toBe(403);
  });
});
