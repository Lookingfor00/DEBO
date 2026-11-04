export const CONSENT_STORAGE_KEY = "solinet-jobs-cookie-consent";

/** Flip to `"opt-in"` for strict APDP/RGPD later (one-line change). */
export const CONSENT_MODE: "opt-out" | "opt-in" = "opt-out";

const KF_KEYS = [
  "kf_anon_id",
  "kf_session",
  "kf_visit_count",
  "kf_first_seen_at",
  "kf_utm_first",
  "kf_utm_last",
  "kf_lead_given",
] as const;

export type CookieConsent = {
  analytics: boolean;
  decidedAt: string;
};

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (typeof parsed.analytics !== "boolean") return null;
    return {
      analytics: parsed.analytics,
      decidedAt:
        typeof parsed.decidedAt === "string"
          ? parsed.decidedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeCookieConsent(analytics: boolean): CookieConsent {
  const value: CookieConsent = {
    analytics,
    decidedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  }
  return value;
}

export function hasDecidedConsent(): boolean {
  return readCookieConsent() !== null;
}

export function isAnalyticsAllowed(): boolean {
  const consent = readCookieConsent();
  if (CONSENT_MODE === "opt-in") {
    return consent?.analytics === true;
  }
  return consent?.analytics !== false;
}

export function purgeAnalyticsIdentity(): void {
  if (typeof window === "undefined") return;
  for (const key of KF_KEYS) {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
