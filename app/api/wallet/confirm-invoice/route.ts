import { NextResponse } from "next/server";

import {
  InvoiceConfirmError,
  confirmWalletInvoice,
  normalizeInvoiceRef,
} from "@/lib/api/wallet";
import { getVisitorSession } from "@/lib/auth0";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function payRedirect(request: Request, params: Record<string, string>) {
  const url = new URL("/pay", request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const session = await getVisitorSession();
  if (!session.sub) {
    return unauthorized();
  }

  const contentType = request.headers.get("content-type") ?? "";
  let reference = "";
  let asForm = false;

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      reference?: unknown;
      invoice_ref?: unknown;
      balance_xof?: unknown;
    };
    void body.balance_xof;
    reference = String(body.reference ?? body.invoice_ref ?? "");
  } else {
    asForm = true;
    const form = await request.formData();
    void form.get("balance_xof");
    reference = String(form.get("reference") ?? form.get("invoice_ref") ?? "");
  }

  const ref = normalizeInvoiceRef(reference);
  if (!ref) {
    if (asForm) {
      return payRedirect(request, { invoice_error: "reference_required" });
    }
    return NextResponse.json({ error: "reference_required" }, { status: 400 });
  }

  try {
    const wallet = await confirmWalletInvoice(session.sub, ref);
    if (asForm) {
      return payRedirect(request, {
        invoice_ref: ref,
        credited: "1",
      });
    }
    return NextResponse.json({
      payer_msisdn: wallet.payer_msisdn,
      balance_xof: wallet.balance_xof,
      last_confirmed_reference: wallet.last_confirmed_reference,
    });
  } catch (error) {
    if (error instanceof InvoiceConfirmError) {
      if (asForm) {
        return payRedirect(request, { invoice_error: error.code });
      }
      const status =
        error.code === "reference_not_found" || error.code === "wallet_not_found"
          ? 404
          : 400;
      return NextResponse.json({ error: error.code }, { status });
    }
    throw error;
  }
}
