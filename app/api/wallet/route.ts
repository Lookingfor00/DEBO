import { NextResponse } from "next/server";

import {
  InvoiceRefRequiredError,
  WalletConflictError,
  getWallet,
  normalizePayerMsisdn,
  putWallet,
} from "@/lib/api/wallet";
import { getVisitorSession } from "@/lib/auth0";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const session = await getVisitorSession();
  if (!session.sub) {
    return unauthorized();
  }
  const url = new URL(request.url);
  const invoiceRef = url.searchParams.get("invoice_ref");
  try {
    const wallet = await getWallet(session.sub, invoiceRef);
    return NextResponse.json(wallet);
  } catch (error) {
    if (error instanceof InvoiceRefRequiredError) {
      return NextResponse.json({ error: "invoice_ref_required" }, { status: 403 });
    }
    throw error;
  }
}

export async function PUT(request: Request) {
  const session = await getVisitorSession();
  if (!session.sub) {
    return unauthorized();
  }
  const body = (await request.json()) as {
    payer_msisdn?: unknown;
    auth0_sub?: unknown;
    balance_xof?: unknown;
  };
  void body.auth0_sub;
  void body.balance_xof;
  const raw = typeof body.payer_msisdn === "string" ? body.payer_msisdn : "";
  if (!normalizePayerMsisdn(raw)) {
    return NextResponse.json({ error: "payer_msisdn_required" }, { status: 400 });
  }
  try {
    const wallet = await putWallet(session.sub, raw);
    return NextResponse.json(wallet);
  } catch (error) {
    if (error instanceof WalletConflictError) {
      return NextResponse.json({ error: "payer_msisdn_taken" }, { status: 409 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const session = await getVisitorSession();
  if (!session.sub) {
    return unauthorized();
  }
  const form = await request.formData();
  void form.get("auth0_sub");
  void form.get("balance_xof");
  const raw = String(form.get("payer_msisdn") ?? "");
  if (!normalizePayerMsisdn(raw)) {
    return NextResponse.redirect(new URL("/pay", request.url), 303);
  }
  try {
    await putWallet(session.sub, raw);
    return NextResponse.redirect(new URL("/pay", request.url), 303);
  } catch (error) {
    if (error instanceof WalletConflictError) {
      return NextResponse.redirect(new URL("/pay?conflict=1", request.url), 303);
    }
    throw error;
  }
}
