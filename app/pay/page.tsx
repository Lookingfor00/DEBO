import { InvoiceRefSync } from "@/components/pay/invoice-ref-sync";
import { PayView } from "@/components/pay/pay-view";
import { loadPayPage } from "@/hooks/pages/load-pay-page";
import { issueActivationCodeForPurchaser } from "@/lib/api/activation-codes";
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
  const invoiceRef = firstParam(params.invoice_ref) ?? null;
  const purchased = firstParam(params.purchased) === "1";
  const state = await loadPayPage(
    session.sub,
    readSupportMsisdn(),
    invoiceRef,
  );
  const purchase = firstParam(params.purchase);
  const purchaseError =
    purchase === "insufficient" || purchase === "missing" ? purchase : null;
  const invoiceError = firstParam(params.invoice_error) ?? null;

  let activationCode: string | null = null;
  let activationCodeAlreadyIssued = false;

  if (purchased && session.sub) {
    const issued = await issueActivationCodeForPurchaser(session.sub);
    if (issued.status === "issued") {
      activationCode = issued.code;
    } else if (issued.status === "already_issued") {
      activationCodeAlreadyIssued = true;
    }
  }

  return (
    <>
      <InvoiceRefSync invoiceRef={invoiceRef} />
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
        purchased={purchased}
        purchaseError={purchaseError}
        invoiceRef={invoiceRef}
        invoiceRefRequired={state.invoiceRefRequired}
        credited={firstParam(params.credited) === "1"}
        invoiceError={invoiceError}
        activationCode={activationCode}
        activationCodeAlreadyIssued={activationCodeAlreadyIssued}
      />
    </>
  );
}
