import { beforeEach, describe, expect, it, vi } from "vitest";

const getVisitorSession = vi.fn();
const getWallet = vi.fn();
const putWallet = vi.fn();

vi.mock("@/lib/auth0", () => ({
  getVisitorSession: (...args: unknown[]) => getVisitorSession(...args),
}));

vi.mock("@/lib/api/wallet", () => {
  class WalletConflictError extends Error {
    constructor() {
      super("wallet_msisdn_taken");
      this.name = "WalletConflictError";
    }
  }
  function normalizePayerMsisdn(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("223")) {
      return digits;
    }
    if (digits.length === 8) {
      return `223${digits}`;
    }
    return digits;
  }
  return {
    WalletConflictError,
    normalizePayerMsisdn,
    getWallet: (...args: unknown[]) => getWallet(...args),
    putWallet: (...args: unknown[]) => putWallet(...args),
  };
});

describe("GET/PUT/POST /api/wallet", () => {
  beforeEach(() => {
    getVisitorSession.mockReset();
    getWallet.mockReset();
    putWallet.mockReset();
  });

  it("rejects unauthenticated GET and PUT", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: false,
      displayName: null,
      sub: null,
    });
    const { GET, PUT } = await import("@/app/api/wallet/route");
    const getResponse = await GET();
    const putResponse = await PUT(
      new Request("http://jobboard.test/api/wallet", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payer_msisdn: "72148718" }),
      }),
    );
    expect(getResponse.status).toBe(401);
    expect(putResponse.status).toBe(401);
    expect(getWallet).not.toHaveBeenCalled();
    expect(putWallet).not.toHaveBeenCalled();
  });

  it("ignores a client-supplied auth0_sub and balance_xof", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    putWallet.mockResolvedValue({
      payer_msisdn: "22372148718",
      balance_xof: 0,
    });
    const { PUT } = await import("@/app/api/wallet/route");
    const response = await PUT(
      new Request("http://jobboard.test/api/wallet", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payer_msisdn: "72148718",
          auth0_sub: "auth0|mallory",
          balance_xof: 99999,
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(putWallet).toHaveBeenCalledWith("auth0|alice", "72148718");
    expect(putWallet).not.toHaveBeenCalledWith("auth0|mallory", expect.anything());
  });

  it("returns 400 when the payer number is missing", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    const { PUT } = await import("@/app/api/wallet/route");
    const response = await PUT(
      new Request("http://jobboard.test/api/wallet", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payer_msisdn: "abc" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(putWallet).not.toHaveBeenCalled();
  });

  it("returns 409 when the number is taken", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    const { WalletConflictError } = await import("@/lib/api/wallet");
    putWallet.mockRejectedValue(new WalletConflictError());
    const { PUT } = await import("@/app/api/wallet/route");
    const response = await PUT(
      new Request("http://jobboard.test/api/wallet", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payer_msisdn: "72148718" }),
      }),
    );
    expect(response.status).toBe(409);
  });

  it("rejects unauthenticated POST from the pay form", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: false,
      displayName: null,
      sub: null,
    });
    const { POST } = await import("@/app/api/wallet/route");
    const body = new URLSearchParams({ payer_msisdn: "72148718" });
    const response = await POST(
      new Request("http://jobboard.test/api/wallet", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      }),
    );
    expect(response.status).toBe(401);
    expect(putWallet).not.toHaveBeenCalled();
  });

  it("redirects to /pay after a successful form save and ignores foreign sub", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    putWallet.mockResolvedValue({
      payer_msisdn: "22372148718",
      balance_xof: 0,
    });
    const { POST } = await import("@/app/api/wallet/route");
    const body = new URLSearchParams({
      payer_msisdn: "72148718",
      auth0_sub: "auth0|mallory",
      balance_xof: "99999",
    });
    const response = await POST(
      new Request("http://jobboard.test/api/wallet", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://jobboard.test/pay");
    expect(putWallet).toHaveBeenCalledWith("auth0|alice", "72148718");
  });

  it("redirects to /pay?conflict=1 when the number is taken", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    const { WalletConflictError } = await import("@/lib/api/wallet");
    putWallet.mockRejectedValue(new WalletConflictError());
    const { POST } = await import("@/app/api/wallet/route");
    const body = new URLSearchParams({ payer_msisdn: "72148718" });
    const response = await POST(
      new Request("http://jobboard.test/api/wallet", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://jobboard.test/pay?conflict=1",
    );
  });

  it("returns the session wallet on GET", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    getWallet.mockResolvedValue({
      payer_msisdn: "22372148718",
      balance_xof: 1500,
    });
    const { GET } = await import("@/app/api/wallet/route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(getWallet).toHaveBeenCalledWith("auth0|alice");
    await expect(response.json()).resolves.toEqual({
      payer_msisdn: "22372148718",
      balance_xof: 1500,
    });
  });
});
