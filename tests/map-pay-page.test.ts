import { describe, expect, it } from "vitest";

import { mapPayPage } from "@/lib/mappers/map-pay-page";

describe("mapPayPage", () => {
  it("maps wallet, merchants, plans, and support without regex fields", () => {
    const vm = mapPayPage(
      { payer_msisdn: "22372148718", balance_xof: 1500 },
      [
        { display_name: "Orange Money", merchant_msisdn: "22370000000" },
        { display_name: "Moov", merchant_msisdn: null },
      ],
      {
        plans: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            slug: "plan_de_test",
            display_name: "Plan de test",
            price_xof: 1000,
            duration_days: 30,
          },
        ],
        subscription: {
          id: "sub-1",
          auth0_sub: "auth0|alice",
          plan_id: "11111111-1111-1111-1111-111111111111",
          starts_at: "2026-10-01T00:00:00Z",
          ends_at: "2026-11-29T00:00:00Z",
        },
        supportMsisdn: " 22370001111 ",
      },
    );
    expect(vm).toEqual({
      payerMsisdn: "22372148718",
      balanceXof: 1500,
      merchants: [
        { displayName: "Orange Money", msisdn: "22370000000" },
        { displayName: "Moov", msisdn: null },
      ],
      plans: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          slug: "plan_de_test",
          displayName: "Plan de test",
          priceXof: 1000,
          durationDays: 30,
        },
      ],
      activeSubscription: { endsAt: "2026-11-29T00:00:00Z" },
      supportMsisdn: "22370001111",
    });
    expect(JSON.stringify(vm)).not.toContain("regex");
  });

  it("maps a missing wallet to null payer and balance", () => {
    expect(mapPayPage({ payer_msisdn: null, balance_xof: null }, [])).toEqual({
      payerMsisdn: null,
      balanceXof: null,
      merchants: [],
      plans: [],
      activeSubscription: null,
      supportMsisdn: null,
    });
  });
});
