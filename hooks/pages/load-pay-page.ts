import { listEnabledPaymentMethods } from "@/lib/api/payment-methods";
import {
  getActiveSubscription,
  listEnabledPlans,
} from "@/lib/api/plans";
import {
  InvoiceRefRequiredError,
  getWallet,
} from "@/lib/api/wallet";
import { mapPayPage, type PayPageVm } from "@/lib/mappers/map-pay-page";

export type PayPageState = {
  data: PayPageVm;
  isError: boolean;
  error: string | null;
  invoiceRefRequired: boolean;
};

const emptyWallet = { payer_msisdn: null, balance_xof: null };

export async function loadPayPage(
  sub?: string | null,
  supportMsisdn?: string | null,
  invoiceRef?: string | null,
): Promise<PayPageState> {
  try {
    const [wallet, methods, plans, subscription] = await Promise.all([
      sub ? getWallet(sub, invoiceRef) : Promise.resolve(emptyWallet),
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
      invoiceRefRequired: false,
    };
  } catch (error) {
    if (error instanceof InvoiceRefRequiredError) {
      try {
        const [methods, plans, subscription] = await Promise.all([
          listEnabledPaymentMethods(),
          listEnabledPlans(),
          sub ? getActiveSubscription(sub) : Promise.resolve(null),
        ]);
        return {
          data: mapPayPage(
            { payer_msisdn: error.payerMsisdn, balance_xof: null },
            methods,
            {
              plans,
              subscription,
              supportMsisdn,
            },
          ),
          isError: false,
          error: null,
          invoiceRefRequired: true,
        };
      } catch (inner) {
        return {
          data: mapPayPage(
            { payer_msisdn: error.payerMsisdn, balance_xof: null },
            [],
            {
              plans: [],
              subscription: null,
              supportMsisdn,
            },
          ),
          isError: true,
          error: inner instanceof Error ? inner.message : String(inner),
          invoiceRefRequired: true,
        };
      }
    }
    return {
      data: mapPayPage(emptyWallet, [], {
        plans: [],
        subscription: null,
        supportMsisdn,
      }),
      isError: true,
      error: error instanceof Error ? error.message : String(error),
      invoiceRefRequired: false,
    };
  }
}
