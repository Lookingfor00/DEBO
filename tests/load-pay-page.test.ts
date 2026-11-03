import { beforeEach, describe, expect, it, vi } from "vitest";

const getWallet = vi.fn();
const listEnabledPaymentMethods = vi.fn();
const listEnabledPlans = vi.fn();
const getActiveSubscription = vi.fn();

vi.mock("@/lib/api/wallet", () => ({
  getWallet: (...args: unknown[]) => getWallet(...args),
}));

vi.mock("@/lib/api/payment-methods", () => ({
  listEnabledPaymentMethods: (...args: unknown[]) =>
    listEnabledPaymentMethods(...args),
}));

vi.mock("@/lib/api/plans", () => ({
  listEnabledPlans: (...args: unknown[]) => listEnabledPlans(...args),
  getActiveSubscription: (...args: unknown[]) => getActiveSubscription(...args),
}));

describe("loadPayPage", () => {
  beforeEach(() => {
    getWallet.mockReset();
    listEnabledPaymentMethods.mockReset();
    listEnabledPlans.mockReset();
    getActiveSubscription.mockReset();
    listEnabledPlans.mockResolvedValue([]);
    getActiveSubscription.mockResolvedValue(null);
  });

  it("loads merchants and plans for anonymous visitors without reading a wallet", async () => {
    listEnabledPaymentMethods.mockResolvedValue([
      { display_name: "Orange Money", merchant_msisdn: "22370000000" },
    ]);
    listEnabledPlans.mockResolvedValue([
      {
        id: "11111111-1111-1111-1111-111111111111",
        slug: "plan_de_test",
        display_name: "Plan de test",
        price_xof: 1000,
        duration_days: 30,
      },
    ]);
    const { loadPayPage } = await import("@/hooks/pages/load-pay-page");
    const state = await loadPayPage(null, "22370001111");
    expect(getWallet).not.toHaveBeenCalled();
    expect(getActiveSubscription).not.toHaveBeenCalled();
    expect(state.isError).toBe(false);
    expect(state.data.payerMsisdn).toBeNull();
    expect(state.data.balanceXof).toBeNull();
    expect(state.data.merchants).toEqual([
      { displayName: "Orange Money", msisdn: "22370000000" },
    ]);
    expect(state.data.plans[0]?.displayName).toBe("Plan de test");
    expect(state.data.supportMsisdn).toBe("22370001111");
  });

  it("maps the session wallet and subscription when a sub is present", async () => {
    getWallet.mockResolvedValue({
      payer_msisdn: "22372148718",
      balance_xof: 1500,
    });
    listEnabledPaymentMethods.mockResolvedValue([]);
    getActiveSubscription.mockResolvedValue({
      id: "sub-1",
      auth0_sub: "auth0|alice",
      plan_id: "11111111-1111-1111-1111-111111111111",
      starts_at: "2026-10-01T00:00:00Z",
      ends_at: "2026-11-29T00:00:00Z",
    });
    const { loadPayPage } = await import("@/hooks/pages/load-pay-page");
    const state = await loadPayPage("auth0|alice");
    expect(getWallet).toHaveBeenCalledWith("auth0|alice");
    expect(getActiveSubscription).toHaveBeenCalledWith("auth0|alice");
    expect(state.data.payerMsisdn).toBe("22372148718");
    expect(state.data.balanceXof).toBe(1500);
    expect(state.data.activeSubscription).toEqual({
      endsAt: "2026-11-29T00:00:00Z",
    });
  });

  it("returns isError when methods fail", async () => {
    listEnabledPaymentMethods.mockRejectedValue(new Error("boom"));
    const { loadPayPage } = await import("@/hooks/pages/load-pay-page");
    const state = await loadPayPage(null);
    expect(state.isError).toBe(true);
    expect(state.error).toBe("boom");
  });
});
