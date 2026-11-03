import "server-only";

import { createJobboardClient } from "@/lib/api/jobboard-client";
import type { WalletDto } from "@/lib/api/types";

export class WalletConflictError extends Error {
  readonly code = "WALLET_CONFLICT";

  constructor() {
    super("wallet_msisdn_taken");
    this.name = "WalletConflictError";
  }
}

export class InvoiceRefRequiredError extends Error {
  readonly code = "INVOICE_REF_REQUIRED";
  readonly payerMsisdn: string | null;

  constructor(payerMsisdn: string | null = null) {
    super("invoice_ref_required");
    this.name = "InvoiceRefRequiredError";
    this.payerMsisdn = payerMsisdn;
  }
}

export class InvoiceConfirmError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "InvoiceConfirmError";
    this.code = code;
  }
}

type WalletRow = {
  payer_msisdn: string;
  balance_xof: number | string;
  last_confirmed_reference?: string | null;
};

type ConfirmRpcPayload = {
  status?: string;
  balance_xof?: number | string;
  last_confirmed_reference?: string;
  error?: string;
  payer_msisdn?: string;
};

export function normalizePayerMsisdn(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("223")) {
    return digits;
  }
  if (digits.length === 8) {
    return `223${digits}`;
  }
  return digits;
}

export function normalizeInvoiceRef(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  const trimmed = String(raw).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function emptyWallet(): WalletDto {
  return { payer_msisdn: null, balance_xof: null };
}

function toDto(row: WalletRow): WalletDto {
  return {
    payer_msisdn: row.payer_msisdn,
    balance_xof: Number(row.balance_xof),
  };
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

async function fetchWalletRow(auth0Sub: string): Promise<WalletRow | null> {
  const supabase = createJobboardClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("payer_msisdn, balance_xof, last_confirmed_reference")
    .eq("auth0_sub", auth0Sub)
    .maybeSingle();
  if (error) {
    throw new Error(`wallet_get_failed:${error.message}`);
  }
  if (!data) {
    return null;
  }
  return data as WalletRow;
}

/** Unchecked read for MSISDN bind / internal use — not for public balance GET. */
export async function getWalletUnchecked(sub: string): Promise<WalletDto> {
  const auth0Sub = sub.trim();
  if (!auth0Sub) {
    return emptyWallet();
  }
  const row = await fetchWalletRow(auth0Sub);
  if (!row) {
    return emptyWallet();
  }
  return toDto(row);
}

/**
 * Balance GET gate: when a wallet row exists, invoice_ref must equal
 * last_confirmed_reference (both null/empty allowed for never-confirmed wallets).
 */
export async function getWallet(
  sub: string,
  invoiceRef?: string | null,
): Promise<WalletDto> {
  const auth0Sub = sub.trim();
  if (!auth0Sub) {
    return emptyWallet();
  }
  const row = await fetchWalletRow(auth0Sub);
  if (!row) {
    return emptyWallet();
  }
  const last = normalizeInvoiceRef(row.last_confirmed_reference);
  const provided = normalizeInvoiceRef(invoiceRef);
  if (last !== provided) {
    throw new InvoiceRefRequiredError(row.payer_msisdn);
  }
  return toDto(row);
}

export async function putWallet(sub: string, payerMsisdn: string): Promise<WalletDto> {
  const auth0Sub = sub.trim();
  const msisdn = normalizePayerMsisdn(payerMsisdn);
  if (!auth0Sub || !msisdn) {
    throw new Error("wallet_put_invalid");
  }
  const supabase = createJobboardClient();
  const existing = await getWalletUnchecked(auth0Sub);
  if (existing.payer_msisdn) {
    const { error } = await supabase
      .from("wallets")
      .update({
        payer_msisdn: msisdn,
        updated_at: new Date().toISOString(),
      })
      .eq("auth0_sub", auth0Sub);
    if (isUniqueViolation(error)) {
      throw new WalletConflictError();
    }
    if (error) {
      throw new Error(`wallet_put_failed:${error.message}`);
    }
  } else {
    const { error } = await supabase.from("wallets").insert({
      auth0_sub: auth0Sub,
      payer_msisdn: msisdn,
    });
    if (isUniqueViolation(error)) {
      throw new WalletConflictError();
    }
    if (error) {
      throw new Error(`wallet_put_failed:${error.message}`);
    }
  }
  return getWalletUnchecked(auth0Sub);
}

export async function confirmWalletInvoice(
  sub: string,
  reference: string,
): Promise<WalletDto & { last_confirmed_reference: string }> {
  const auth0Sub = sub.trim();
  const ref = normalizeInvoiceRef(reference);
  if (!auth0Sub || !ref) {
    throw new InvoiceConfirmError("reference_required");
  }
  const supabase = createJobboardClient();
  const { data, error } = await supabase.rpc("confirm_wallet_invoice", {
    p_auth0_sub: auth0Sub,
    p_reference: ref,
  });
  if (error) {
    throw new Error(`confirm_invoice_failed:${error.message}`);
  }
  const payload = (data ?? {}) as ConfirmRpcPayload;
  if (payload.error) {
    throw new InvoiceConfirmError(payload.error);
  }
  if (payload.status !== "credited" || payload.balance_xof == null) {
    throw new Error("confirm_invoice_failed:unexpected");
  }
  const wallet = await getWallet(auth0Sub, ref);
  return {
    ...wallet,
    last_confirmed_reference: ref,
  };
}
