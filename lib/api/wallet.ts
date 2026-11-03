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

type WalletRow = {
  payer_msisdn: string;
  balance_xof: number | string;
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

export async function getWallet(sub: string): Promise<WalletDto> {
  const auth0Sub = sub.trim();
  if (!auth0Sub) {
    return emptyWallet();
  }
  const supabase = createJobboardClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("payer_msisdn, balance_xof")
    .eq("auth0_sub", auth0Sub)
    .maybeSingle();
  if (error) {
    throw new Error(`wallet_get_failed:${error.message}`);
  }
  if (!data) {
    return emptyWallet();
  }
  return toDto(data as WalletRow);
}

export async function putWallet(sub: string, payerMsisdn: string): Promise<WalletDto> {
  const auth0Sub = sub.trim();
  const msisdn = normalizePayerMsisdn(payerMsisdn);
  if (!auth0Sub || !msisdn) {
    throw new Error("wallet_put_invalid");
  }
  const supabase = createJobboardClient();
  const existing = await getWallet(auth0Sub);
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
  return getWallet(auth0Sub);
}
