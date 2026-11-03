import { beforeEach, describe, expect, it, vi } from "vitest";

const getVisitorSession = vi.fn();
const listEnabledPlans = vi.fn();
const purchasePlan = vi.fn();
const issueActivationCodeForPurchaser = vi.fn();

vi.mock("@/lib/auth0", () => ({
  getVisitorSession: (...args: unknown[]) => getVisitorSession(...args),
}));

vi.mock("@/lib/api/activation-codes", () => ({
  issueActivationCodeForPurchaser: (...args: unknown[]) =>
    issueActivationCodeForPurchaser(...args),
}));

vi.mock("@/lib/api/plans", () => {
  class InsufficientBalanceError extends Error {
    readonly code = "insufficient_balance";
    constructor() {
      super("insufficient_balance");
      this.name = "InsufficientBalanceError";
    }
  }
  class PlanNotFoundError extends Error {
    readonly code = "plan_not_found";
    constructor() {
      super("plan_not_found");
      this.name = "PlanNotFoundError";
    }
  }
  return {
    InsufficientBalanceError,
    PlanNotFoundError,
    listEnabledPlans: (...args: unknown[]) => listEnabledPlans(...args),
    purchasePlan: (...args: unknown[]) => purchasePlan(...args),
  };
});

describe("GET /api/plans and POST /api/plans/purchase", () => {
  beforeEach(() => {
    getVisitorSession.mockReset();
    listEnabledPlans.mockReset();
    purchasePlan.mockReset();
    issueActivationCodeForPurchaser.mockReset();
    issueActivationCodeForPurchaser.mockResolvedValue({
      status: "issued",
      code: "SAVE-ME-NOW",
    });
  });

  it("lists enabled plans without auth", async () => {
    listEnabledPlans.mockResolvedValue([
      {
        id: "11111111-1111-1111-1111-111111111111",
        slug: "plan_de_test",
        display_name: "Plan de test",
        price_xof: 1000,
        duration_days: 30,
      },
    ]);
    const { GET } = await import("@/app/api/plans/route");
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        slug: "plan_de_test",
        display_name: "Plan de test",
        price_xof: 1000,
        duration_days: 30,
      },
    ]);
  });

  it("rejects unauthenticated purchase", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: false,
      displayName: null,
      sub: null,
    });
    const { POST } = await import("@/app/api/plans/purchase/route");
    const response = await POST(
      new Request("http://jobboard.test/api/plans/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plan_id: "11111111-1111-1111-1111-111111111111",
        }),
      }),
    );
    expect(response.status).toBe(401);
    expect(purchasePlan).not.toHaveBeenCalled();
  });

  it("purchases with session sub and ignores client auth0_sub/balance", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "Alice",
      sub: "auth0|alice",
    });
    purchasePlan.mockResolvedValue({
      balance_xof: 500,
      subscription: {
        id: "sub-1",
        auth0_sub: "auth0|alice",
        plan_id: "11111111-1111-1111-1111-111111111111",
        starts_at: "2026-10-30T00:00:00Z",
        ends_at: "2026-11-29T00:00:00Z",
      },
    });
    const { POST } = await import("@/app/api/plans/purchase/route");
    const response = await POST(
      new Request("http://jobboard.test/api/plans/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plan_id: "11111111-1111-1111-1111-111111111111",
          auth0_sub: "auth0|attacker",
          balance_xof: 99999,
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(purchasePlan).toHaveBeenCalledWith(
      "auth0|alice",
      "11111111-1111-1111-1111-111111111111",
    );
    expect(issueActivationCodeForPurchaser).toHaveBeenCalledWith("auth0|alice");
    await expect(response.json()).resolves.toMatchObject({
      balance_xof: 500,
      activation_code: "SAVE-ME-NOW",
      activation_code_already_issued: false,
    });
  });

  it("JSON purchase returns already_issued without a second plaintext code", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "Alice",
      sub: "auth0|alice",
    });
    purchasePlan.mockResolvedValue({
      balance_xof: 500,
      subscription: {
        id: "sub-1",
        auth0_sub: "auth0|alice",
        plan_id: "11111111-1111-1111-1111-111111111111",
        starts_at: "2026-10-30T00:00:00Z",
        ends_at: "2026-11-29T00:00:00Z",
      },
    });
    issueActivationCodeForPurchaser.mockResolvedValue({
      status: "already_issued",
    });
    const { POST } = await import("@/app/api/plans/purchase/route");
    const response = await POST(
      new Request("http://jobboard.test/api/plans/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plan_id: "11111111-1111-1111-1111-111111111111",
        }),
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      balance_xof: 500,
      activation_code: null,
      activation_code_already_issued: true,
    });
  });

  it("returns 400 insufficient_balance", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "Alice",
      sub: "auth0|alice",
    });
    const { InsufficientBalanceError } = await import("@/lib/api/plans");
    purchasePlan.mockRejectedValue(new InsufficientBalanceError());
    const { POST } = await import("@/app/api/plans/purchase/route");
    const response = await POST(
      new Request("http://jobboard.test/api/plans/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plan_id: "11111111-1111-1111-1111-111111111111",
        }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "insufficient_balance",
    });
  });

  it("returns 404 when plan is missing", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "Alice",
      sub: "auth0|alice",
    });
    const { PlanNotFoundError } = await import("@/lib/api/plans");
    purchasePlan.mockRejectedValue(new PlanNotFoundError());
    const { POST } = await import("@/app/api/plans/purchase/route");
    const response = await POST(
      new Request("http://jobboard.test/api/plans/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plan_id: "11111111-1111-1111-1111-111111111111",
        }),
      }),
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "plan_not_found" });
  });

  it("form POST redirects to /pay?purchased=1 on success", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "Alice",
      sub: "auth0|alice",
    });
    purchasePlan.mockResolvedValue({
      balance_xof: 500,
      subscription: {
        id: "sub-1",
        auth0_sub: "auth0|alice",
        plan_id: "11111111-1111-1111-1111-111111111111",
        starts_at: "2026-10-30T00:00:00Z",
        ends_at: "2026-11-29T00:00:00Z",
      },
    });
    const { POST } = await import("@/app/api/plans/purchase/route");
    const body = new URLSearchParams({
      plan_id: "11111111-1111-1111-1111-111111111111",
      auth0_sub: "auth0|attacker",
      balance_xof: "99999",
    });
    const response = await POST(
      new Request("http://jobboard.test/api/plans/purchase", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://jobboard.test/pay?purchased=1",
    );
    expect(purchasePlan).toHaveBeenCalledWith(
      "auth0|alice",
      "11111111-1111-1111-1111-111111111111",
    );
  });

  it("form POST redirects to purchase=insufficient on short balance", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "Alice",
      sub: "auth0|alice",
    });
    const { InsufficientBalanceError } = await import("@/lib/api/plans");
    purchasePlan.mockRejectedValue(new InsufficientBalanceError());
    const { POST } = await import("@/app/api/plans/purchase/route");
    const response = await POST(
      new Request("http://jobboard.test/api/plans/purchase", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          plan_id: "11111111-1111-1111-1111-111111111111",
        }),
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://jobboard.test/pay?purchase=insufficient",
    );
  });
});
