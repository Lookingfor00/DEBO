import type {
  PayMerchantVm,
  PayPageVm,
  PayPlanVm,
} from "@/lib/mappers/map-pay-page";

export const payMerchantFixture: PayMerchantVm = {
  displayName: "Orange Money",
  msisdn: "22370000000",
};

export const payPlanFixture: PayPlanVm = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "plan_de_test",
  displayName: "Plan de test",
  priceXof: 1000,
  durationDays: 30,
};

export const payPageFixture: PayPageVm = {
  payerMsisdn: "22372148718",
  balanceXof: 1500,
  merchants: [
    payMerchantFixture,
    { displayName: "Moov", msisdn: null },
  ],
  plans: [payPlanFixture],
  activeSubscription: null,
  supportMsisdn: null,
};
