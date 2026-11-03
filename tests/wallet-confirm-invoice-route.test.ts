import { beforeEach, describe, expect, it, vi } from "vitest";

const getVisitorSession = vi.fn();
const confirmWalletInvoice = vi.fn();

vi.mock("@/lib/auth0", () => ({
  getVisitorSession: (...args: unknown[]) => getVisitorSession(...args),
}));

vi.mock("@/lib/api/wallet", () => {
  class InvoiceConfirmError extends Error {
    readonly code: string;
    constructor(code: string) {
      super(code);
      this.name = "InvoiceConfirmError";
      this.code = code;
    }
  }
  function normalizeInvoiceRef(raw: string | null | undefined): string | null {
    if (raw == null) {
      return null;
    }
    const trimmed = String(raw).trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return {
    InvoiceConfirmError,
    normalizeInvoiceRef,
    confirmWalletInvoice: (...args: unknown[]) => confirmWalletInvoice(...args),
  };
});

describe("POST /api/wallet/confirm-invoice", () => {
  beforeEach(() => {
    getVisitorSession.mockReset();
    confirmWalletInvoice.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: false,
      displayName: null,
      sub: null,
    });
    const { POST } = await import("@/app/api/wallet/confirm-invoice/route");
    const response = await POST(
      new Request("http://jobboard.test/api/wallet/confirm-invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference: "INV-1" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(confirmWalletInvoice).not.toHaveBeenCalled();
  });

  it("credits via JSON and ignores client balance_xof", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    confirmWalletInvoice.mockResolvedValue({
      payer_msisdn: "22372148718",
      balance_xof: 1500,
      last_confirmed_reference: "INV-1",
    });
    const { POST } = await import("@/app/api/wallet/confirm-invoice/route");
    const response = await POST(
      new Request("http://jobboard.test/api/wallet/confirm-invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reference: "INV-1",
          balance_xof: 99999,
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(confirmWalletInvoice).toHaveBeenCalledWith("auth0|alice", "INV-1");
    await expect(response.json()).resolves.toEqual({
      payer_msisdn: "22372148718",
      balance_xof: 1500,
      last_confirmed_reference: "INV-1",
    });
  });

  it("returns 404 when the reference is unknown", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    const { InvoiceConfirmError } = await import("@/lib/api/wallet");
    confirmWalletInvoice.mockRejectedValue(
      new InvoiceConfirmError("reference_not_found"),
    );
    const { POST } = await import("@/app/api/wallet/confirm-invoice/route");
    const response = await POST(
      new Request("http://jobboard.test/api/wallet/confirm-invoice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference: "BAD" }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("redirects form posts with invoice_ref on success", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    confirmWalletInvoice.mockResolvedValue({
      payer_msisdn: "22372148718",
      balance_xof: 500,
      last_confirmed_reference: "INV-9",
    });
    const { POST } = await import("@/app/api/wallet/confirm-invoice/route");
    const body = new URLSearchParams({
      reference: "INV-9",
      balance_xof: "99999",
    });
    const response = await POST(
      new Request("http://jobboard.test/api/wallet/confirm-invoice", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://jobboard.test/pay?invoice_ref=INV-9&credited=1",
    );
  });
});
