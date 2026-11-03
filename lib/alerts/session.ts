import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { getPhoneActivationById } from "@/lib/api/activation-codes";

export const ALERTS_SESSION_COOKIE = "jobboard_alerts_session";

export type AlertsSession = {
  phoneActivationId: string;
  msisdn: string;
};

function sessionSecret(): string {
  const secret = process.env.ALERTS_SESSION_SECRET?.trim() ?? "";
  if (!secret) {
    throw new Error("Missing ALERTS_SESSION_SECRET");
  }
  return secret;
}

function signPayload(phoneActivationId: string): string {
  const payload = Buffer.from(phoneActivationId, "utf8").toString("base64url");
  const sig = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function createAlertsSessionToken(phoneActivationId: string): string {
  const id = phoneActivationId.trim();
  if (!id) {
    throw new Error("phone_activation_id_required");
  }
  return signPayload(id);
}

export function verifyAlertsSessionToken(token: string): string | null {
  const raw = token.trim();
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) {
    return null;
  }
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!payload || !sig) {
    return null;
  }
  const expected = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  try {
    const id = Buffer.from(payload, "base64url").toString("utf8").trim();
    return id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

export function alertsSessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 180) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Read + validate alerts session cookie; null if missing, forged, or code invalidated. */
export async function getAlertsSession(): Promise<AlertsSession | null> {
  const jar = await cookies();
  const token = jar.get(ALERTS_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  let phoneActivationId: string | null;
  try {
    phoneActivationId = verifyAlertsSessionToken(token);
  } catch {
    return null;
  }
  if (!phoneActivationId) {
    return null;
  }
  const binding = await getPhoneActivationById(phoneActivationId);
  if (!binding || binding.codeStatus === "invalidated") {
    return null;
  }
  return {
    phoneActivationId: binding.id,
    msisdn: binding.msisdn,
  };
}
