import type {
  PaymentMethodPublicDto,
  PlanDto,
  SubscriptionDto,
  WalletDto,
} from "@/lib/api/types";

export type PayMerchantVm = {
  displayName: string;
  msisdn: string | null;
};

export type PayPlanVm = {
  id: string;
  slug: string;
  displayName: string;
  priceXof: number;
  durationDays: number;
};

export type PaySubscriptionVm = {
  endsAt: string;
};

export type PayPageVm = {
  payerMsisdn: string | null;
  balanceXof: number | null;
  merchants: PayMerchantVm[];
  plans: PayPlanVm[];
  activeSubscription: PaySubscriptionVm | null;
  supportMsisdn: string | null;
};

export function mapPayPage(
  wallet: WalletDto,
  methods: PaymentMethodPublicDto[],
  extras: {
    plans?: PlanDto[];
    subscription?: SubscriptionDto | null;
    supportMsisdn?: string | null;
  } = {},
): PayPageVm {
  const support = extras.supportMsisdn?.trim() || null;
  return {
    payerMsisdn: wallet.payer_msisdn,
    balanceXof: wallet.balance_xof,
    merchants: methods.map((method) => ({
      displayName: method.display_name,
      msisdn: method.merchant_msisdn,
    })),
    plans: (extras.plans ?? []).map((plan) => ({
      id: plan.id,
      slug: plan.slug,
      displayName: plan.display_name,
      priceXof: plan.price_xof,
      durationDays: plan.duration_days,
    })),
    activeSubscription: extras.subscription
      ? { endsAt: extras.subscription.ends_at }
      : null,
    supportMsisdn: support,
  };
}
