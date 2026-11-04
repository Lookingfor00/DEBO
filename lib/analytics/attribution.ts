const FIRST_KEY = "kf_utm_first";
const LAST_KEY = "kf_utm_last";

export type UtmFields = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export type AttributionSnapshot = {
  source: string | null;
  referrer_domain: string | null;
  utm: UtmFields;
  first_utm: UtmFields;
};

function truncate(value: string, max = 120): string {
  return value.slice(0, max);
}

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function utmFromParams(params: URLSearchParams): UtmFields {
  const pick = (key: string) => {
    const v = params.get(key);
    return v ? truncate(v) : undefined;
  };
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_content: pick("utm_content"),
    utm_term: pick("utm_term"),
  };
}

function hasUtm(utm: UtmFields): boolean {
  return Boolean(
    utm.utm_source ||
      utm.utm_medium ||
      utm.utm_campaign ||
      utm.utm_content ||
      utm.utm_term,
  );
}

function referrerDomain(): string | null {
  try {
    if (!document.referrer) return null;
    return truncate(new URL(document.referrer).hostname, 120);
  } catch {
    return null;
  }
}

function sourceFromReferrer(domain: string | null): string | null {
  if (!domain) return "direct";
  const d = domain.toLowerCase();
  if (d.includes("google.")) return "google";
  if (d.includes("facebook.") || d === "fb.com" || d === "m.facebook.com") {
    return "facebook";
  }
  if (d.includes("instagram.")) return "instagram";
  if (d.includes("linkedin.")) return "linkedin";
  if (d.includes("t.co") || d.includes("twitter.") || d.includes("x.com")) {
    return "twitter";
  }
  if (d.includes("whatsapp.") || d === "wa.me") return "whatsapp";
  return domain;
}

/** Capture UTM from the current URL into first/last touch storage. */
export function captureAttributionFromSearch(
  searchParams: URLSearchParams,
): void {
  if (typeof window === "undefined") return;
  const utm = utmFromParams(searchParams);
  if (!hasUtm(utm)) return;

  writeJson(window.sessionStorage, LAST_KEY, utm);
  const first = readJson<UtmFields>(window.localStorage, FIRST_KEY);
  if (!first || !hasUtm(first)) {
    writeJson(window.localStorage, FIRST_KEY, utm);
  }
}

export function getAttribution(): AttributionSnapshot {
  if (typeof window === "undefined") {
    return { source: null, referrer_domain: null, utm: {}, first_utm: {} };
  }
  const last =
    readJson<UtmFields>(window.sessionStorage, LAST_KEY) ??
    utmFromParams(new URLSearchParams(window.location.search));
  const first =
    readJson<UtmFields>(window.localStorage, FIRST_KEY) ??
    (hasUtm(last) ? last : {});
  const ref = referrerDomain();
  const source = hasUtm(last)
    ? truncate(last.utm_source || "utm", 120)
    : sourceFromReferrer(ref);

  return {
    source,
    referrer_domain: ref,
    utm: last,
    first_utm: first,
  };
}
