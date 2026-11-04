import { NextResponse } from "next/server";

import { createJobboardClient } from "@/lib/api/jobboard-client";
import {
  sanitizeProperties,
  trackBatchSchema,
  type TrackEventInput,
} from "@/lib/analytics/validate";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX;
}

function isBot(ua: string | null): boolean {
  if (!ua) return false;
  return /bot|crawl|spider|slurp|facebookexternalhit|preview|headless/i.test(
    ua,
  );
}

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const candidate = origin || (referer ? safeOrigin(referer) : null);
  if (!candidate) {
    // sendBeacon / same-origin may omit Origin; allow missing when host matches
    const host = request.headers.get("host");
    if (!host) return false;
    return isAllowedHost(host);
  }
  try {
    const url = new URL(candidate);
    return isAllowedHost(url.host);
  } catch {
    return false;
  }
}

function safeOrigin(referer: string): string | null {
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h.startsWith("localhost") || h.startsWith("127.0.0.1")) return true;
  if (h.endsWith(".vercel.app")) return true;
  for (const envName of ["NEXT_PUBLIC_SITE_URL", "APP_BASE_URL"] as const) {
    const site = process.env[envName];
    if (!site) continue;
    try {
      if (new URL(site).host.toLowerCase() === h) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function geoFromHeaders(request: Request): {
  country: string | null;
  region: string | null;
  city: string | null;
} {
  return {
    country: request.headers.get("x-vercel-ip-country"),
    region: request.headers.get("x-vercel-ip-country-region"),
    city: request.headers.get("x-vercel-ip-city"),
  };
}

function toRow(
  event: TrackEventInput,
  geo: { country: string | null; region: string | null; city: string | null },
) {
  return {
    client_ts: event.client_ts ?? null,
    event_name: event.event_name,
    anon_id: event.anon_id ?? null,
    session_id: event.session_id ?? null,
    path: event.path ?? null,
    item_id: event.item_id ?? null,
    item_code: event.item_code ?? null,
    category_id: event.category_id ?? null,
    source: event.source ?? null,
    referrer_domain: event.referrer_domain ?? null,
    utm_source: event.utm_source ?? null,
    utm_medium: event.utm_medium ?? null,
    utm_campaign: event.utm_campaign ?? null,
    utm_content: event.utm_content ?? null,
    utm_term: event.utm_term ?? null,
    first_utm_source: event.first_utm_source ?? null,
    first_utm_medium: event.first_utm_medium ?? null,
    first_utm_campaign: event.first_utm_campaign ?? null,
    device_type: event.device_type ?? null,
    os: event.os ?? null,
    browser: event.browser ?? null,
    connection_type: event.connection_type ?? null,
    language: event.language ?? null,
    viewport_w: event.viewport_w ?? null,
    viewport_h: event.viewport_h ?? null,
    country: geo.country,
    region: geo.region,
    city: geo.city,
    is_returning: event.is_returning ?? null,
    visit_count: event.visit_count ?? null,
    properties: sanitizeProperties(event.properties),
  };
}

export async function POST(request: Request) {
  try {
    if (process.env.ANALYTICS_INGEST_DISABLED === "true") {
      return new NextResponse(null, { status: 204 });
    }

    const ua = request.headers.get("user-agent");
    if (isBot(ua)) {
      return new NextResponse(null, { status: 204 });
    }

    if (!originAllowed(request)) {
      return new NextResponse(null, { status: 204 });
    }

    const ip = clientIp(request);
    if (rateLimited(ip)) {
      return new NextResponse(null, { status: 204 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new NextResponse(null, { status: 204 });
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return new NextResponse(null, { status: 204 });
    }

    const parsed = trackBatchSchema.safeParse(json);
    if (!parsed.success) {
      return new NextResponse(null, { status: 204 });
    }

    const geo = geoFromHeaders(request);
    const rows = parsed.data.events.map((event) => toRow(event, geo));

    const supabase = createJobboardClient();
    const { error } = await supabase.from("analytics_events").insert(rows);
    if (error) {
      // swallow — never leak to client
      console.error("analytics_ingest_failed", error.message);
    }
  } catch (error) {
    console.error(
      "analytics_ingest_exception",
      error instanceof Error ? error.message : "unknown",
    );
  }

  return new NextResponse(null, { status: 204 });
}
