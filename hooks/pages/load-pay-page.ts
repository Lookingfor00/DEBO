import { listEnabledPaymentMethods } from "@/lib/api/payment-methods";
import {
  getActiveSubscription,
  listEnabledPlans,
} from "@/lib/api/plans";
import { getWallet } from "@/lib/api/wallet";
import { mapPayPage, type PayPageVm } from "@/lib/mappers/map-pay-page";

export type PayPageState = {
  data: PayPageVm;
  isError: boolean;
  error: string | null;
};

const emptyWallet = { payer_msisdn: null, balance_xof: null };

export async function loadPayPage(
  sub?: string | null,
  supportMsisdn?: string | null,
): Promise<PayPageState> {
  try {
    const [wallet, methods, plans, subscription] = await Promise.all([
      sub ? getWallet(sub) : Promise.resolve(emptyWallet),
      listEnabledPaymentMethods(),
      listEnabledPlans(),
      sub ? getActiveSubscription(sub) : Promise.resolve(null),
    ]);
    return {
      data: mapPayPage(wallet, methods, {
        plans,
        subscription,
        supportMsisdn,
      }),
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      data: mapPayPage(emptyWallet, [], {
        plans: [],
        subscription: null,
        supportMsisdn,
      }),
      isError: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
