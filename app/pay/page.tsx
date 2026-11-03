import { PayView } from "@/components/pay/pay-view";
import { loadPayPage } from "@/hooks/pages/load-pay-page";
import { getVisitorSession } from "@/lib/auth0";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function readSupportMsisdn(): string | null {
  const raw = process.env.SUPPORT_MSISDN?.trim() ?? "";
  return raw.length > 0 ? raw : null;
}

export default async function PayPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getVisitorSession();
  const state = await loadPayPage(session.sub, readSupportMsisdn());
  const purchase = firstParam(params.purchase);
  const purchaseError =
    purchase === "insufficient" || purchase === "missing" ? purchase : null;

  return (
    <PayView
      isAuthenticated={session.isAuthenticated}
      payerMsisdn={state.data.payerMsisdn}
      balanceXof={state.data.balanceXof}
      merchants={state.data.merchants}
      plans={state.data.plans}
      activeSubscription={state.data.activeSubscription}
      supportMsisdn={state.data.supportMsisdn}
      isError={state.isError}
      error={state.error}
      conflict={firstParam(params.conflict) === "1"}
      purchased={firstParam(params.purchased) === "1"}
      purchaseError={purchaseError}
    />
  );
}
