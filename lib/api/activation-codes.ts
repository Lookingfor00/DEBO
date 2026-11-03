import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { createJobboardClient } from "@/lib/api/jobboard-client";
import { getActiveSubscription } from "@/lib/api/plans";
import { getWalletUnchecked, normalizePayerMsisdn } from "@/lib/api/wallet";

export class CodeAlreadyIssuedError extends Error {
  readonly code = "CODE_ALREADY_ISSUED";

  constructor() {
    super("code_already_issued");
    this.name = "CodeAlreadyIssuedError";
  }
}

export class NoActiveSubscriptionError extends Error {
  readonly code = "NO_ACTIVE_SUBSCRIPTION";

  constructor() {
    super("no_active_subscription");
    this.name = "NoActiveSubscriptionError";
  }
}

export class ActivationCodeError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "ActivationCodeError";
    this.code = code;
  }
}

type ActivationCodeRow = {
  id: string;
  code_hash: string;
  status: "available" | "used" | "invalidated";
  purchaser_auth0_sub: string | null;
  purchaser_msisdn: string | null;
};

type PhoneActivationRow = {
  id: string;
  msisdn: string;
  activation_code_id: string;
};

export type ActivateResult = {
  phoneActivationId: string;
  msisdn: string;
};

export type MintedCode = {
  code: string;
  id: string;
};

/** Result of minting after purchase — never invents a code in the browser. */
export type IssuedActivationCodeResult =
  | { status: "issued"; code: string }
  | { status: "already_issued" }
  | { status: "unavailable" };

/**
 * Mint once for a purchaser after subscription purchase.
 * Maps TB-019 errors into a safe UI/API payload (no plaintext on already-issued).
 */
export async function issueActivationCodeForPurchaser(
  auth0Sub: string,
): Promise<IssuedActivationCodeResult> {
  try {
    const minted = await requestActivationCode(auth0Sub);
    return { status: "issued", code: minted.code };
  } catch (error) {
    if (error instanceof CodeAlreadyIssuedError) {
      return { status: "already_issued" };
    }
    return { status: "unavailable" };
  }
}

/** SHA-256 hex of the plaintext activation code. */
export function hashActivationCode(plaintext: string): string {
  return createHash("sha256").update(plaintext.trim(), "utf8").digest("hex");
}

function mintPlaintextCode(): string {
  // Compact, URL-safe-ish alphanumeric (uppercase + digits), ~20 chars.
  return randomBytes(12).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

export async function requestActivationCode(auth0Sub: string): Promise<MintedCode> {
  const sub = auth0Sub.trim();
  if (!sub) {
    throw new ActivationCodeError("auth0_sub_required");
  }

  const subscription = await getActiveSubscription(sub);
  if (!subscription) {
    throw new NoActiveSubscriptionError();
  }

  const supabase = createJobboardClient();
  const { data: existing, error: existingError } = await supabase
    .from("activation_codes")
    .select("id, status")
    .eq("purchaser_auth0_sub", sub)
    .in("status", ["available", "used"])
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(`activation_code_lookup_failed:${existingError.message}`);
  }
  if (existing) {
    throw new CodeAlreadyIssuedError();
  }

  const wallet = await getWalletUnchecked(sub);
  let plaintext = mintPlaintextCode();
  // Ensure non-empty after filtering
  if (plaintext.length < 8) {
    plaintext = randomBytes(16).toString("hex").slice(0, 16).toUpperCase();
  }
  const codeHash = hashActivationCode(plaintext);

  const { data, error } = await supabase
    .from("activation_codes")
    .insert({
      code_hash: codeHash,
      status: "available",
      purchaser_auth0_sub: sub,
      purchaser_msisdn: wallet.payer_msisdn,
    })
    .select("id")
    .single();

  if (error) {
    // Unique code_hash collision is extremely unlikely; treat as failure.
    if (error.code === "23505") {
      throw new CodeAlreadyIssuedError();
    }
    throw new Error(`activation_code_mint_failed:${error.message}`);
  }

  return { code: plaintext, id: (data as { id: string }).id };
}

export async function activateWithCode(
  rawMsisdn: string,
  plaintextCode: string,
): Promise<ActivateResult> {
  const msisdn = normalizePayerMsisdn(rawMsisdn);
  const code = plaintextCode.trim();
  if (!msisdn || !code) {
    throw new ActivationCodeError("msisdn_and_code_required");
  }

  const codeHash = hashActivationCode(code);
  const supabase = createJobboardClient();

  const { data: row, error } = await supabase
    .from("activation_codes")
    .select("id, code_hash, status, purchaser_auth0_sub, purchaser_msisdn")
    .eq("code_hash", codeHash)
    .maybeSingle();

  if (error) {
    throw new Error(`activation_code_get_failed:${error.message}`);
  }
  if (!row) {
    throw new ActivationCodeError("code_not_found");
  }

  const activation = row as ActivationCodeRow;

  if (activation.status === "invalidated") {
    throw new ActivationCodeError("code_invalidated");
  }

  if (activation.status === "used") {
    const { data: phone, error: phoneError } = await supabase
      .from("phone_activations")
      .select("id, msisdn, activation_code_id")
      .eq("activation_code_id", activation.id)
      .maybeSingle();
    if (phoneError) {
      throw new Error(`phone_activation_get_failed:${phoneError.message}`);
    }
    if (!phone) {
      throw new ActivationCodeError("code_used_without_binding");
    }
    const binding = phone as PhoneActivationRow;
    if (binding.msisdn !== msisdn) {
      throw new ActivationCodeError("code_bound_to_other_msisdn");
    }
    return { phoneActivationId: binding.id, msisdn: binding.msisdn };
  }

  // available → bind
  const { data: inserted, error: insertError } = await supabase
    .from("phone_activations")
    .insert({
      msisdn,
      activation_code_id: activation.id,
    })
    .select("id, msisdn")
    .single();

  if (insertError) {
    throw new Error(`phone_activation_insert_failed:${insertError.message}`);
  }

  const { error: updateError } = await supabase
    .from("activation_codes")
    .update({
      status: "used",
      used_at: new Date().toISOString(),
    })
    .eq("id", activation.id)
    .eq("status", "available");

  if (updateError) {
    throw new Error(`activation_code_mark_used_failed:${updateError.message}`);
  }

  const bound = inserted as { id: string; msisdn: string };
  return { phoneActivationId: bound.id, msisdn: bound.msisdn };
}

export async function invalidateActivationCode(plaintextCode: string): Promise<void> {
  const code = plaintextCode.trim();
  if (!code) {
    throw new ActivationCodeError("code_required");
  }
  const codeHash = hashActivationCode(code);
  const supabase = createJobboardClient();

  const { data: row, error } = await supabase
    .from("activation_codes")
    .select("id, status")
    .eq("code_hash", codeHash)
    .maybeSingle();

  if (error) {
    throw new Error(`activation_code_get_failed:${error.message}`);
  }
  if (!row) {
    throw new ActivationCodeError("code_not_found");
  }

  const status = (row as { id: string; status: string }).status;
  if (status === "invalidated") {
    return;
  }

  const { error: updateError } = await supabase
    .from("activation_codes")
    .update({
      status: "invalidated",
      invalidated_at: new Date().toISOString(),
    })
    .eq("id", (row as { id: string }).id);

  if (updateError) {
    throw new Error(`activation_code_invalidate_failed:${updateError.message}`);
  }
}

export async function getPhoneActivationById(
  phoneActivationId: string,
): Promise<{ id: string; msisdn: string; codeStatus: string } | null> {
  const id = phoneActivationId.trim();
  if (!id) {
    return null;
  }
  const supabase = createJobboardClient();
  const { data: phone, error } = await supabase
    .from("phone_activations")
    .select("id, msisdn, activation_code_id")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`phone_activation_get_failed:${error.message}`);
  }
  if (!phone) {
    return null;
  }
  const binding = phone as PhoneActivationRow;
  const { data: codeRow, error: codeError } = await supabase
    .from("activation_codes")
    .select("status")
    .eq("id", binding.activation_code_id)
    .maybeSingle();
  if (codeError) {
    throw new Error(`activation_code_get_failed:${codeError.message}`);
  }
  if (!codeRow) {
    return null;
  }
  return {
    id: binding.id,
    msisdn: binding.msisdn,
    codeStatus: (codeRow as { status: string }).status,
  };
}
