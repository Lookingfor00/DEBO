import { getAttribution } from "@/lib/analytics/attribution";
import {
  clarityEvent,
  claritySetTag,
} from "@/lib/analytics/clarity";
import { getDeviceContext } from "@/lib/analytics/context";
import {
  CLARITY_SKIP_EVENTS,
  EVENT_NAME_SET,
  isSkipPath,
  type EventName,
} from "@/lib/analytics/events";
import {
  getAnonId,
  getSessionId,
  getVisitCount,
  isReturningVisitor,
} from "@/lib/analytics/identity";
import { sanitizeProperties } from "@/lib/analytics/validate";
import { isAnalyticsAllowed } from "@/lib/consent/cookie-consent";

const QUEUE_KEY = "__solinet_jobs_analytics_queue";
const FLUSH_MS = 5000;
const FLUSH_AT = 10;

export type TrackProperties = Record<string, unknown> & {
  item_id?: string;
  item_code?: string;
  category_id?: string;
  cta_id?: string;
  location?: string;
  target?: string;
  choice?: "accepted" | "refused";
};

type QueuedEvent = Record<string, unknown>;

type QueueState = {
  events: QueuedEvent[];
  timer: ReturnType<typeof setTimeout> | null;
};

function getQueue(): QueueState {
  const w = window as Window & { [QUEUE_KEY]?: QueueState };
  if (!w[QUEUE_KEY]) {
    w[QUEUE_KEY] = { events: [], timer: null };
  }
  return w[QUEUE_KEY]!;
}

function shouldSendNetwork(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";
}

export function applyClaritySessionTags(): void {
  try {
    const attr = getAttribution();
    const ctx = getDeviceContext(
      typeof window !== "undefined" ? window.location.pathname : "/",
    );
    if (attr.source) claritySetTag("source", attr.source);
    if (attr.utm.utm_campaign) {
      claritySetTag("utm_campaign", attr.utm.utm_campaign);
    }
    claritySetTag("device_type", ctx.device_type);
    claritySetTag("returning", isReturningVisitor() ? "1" : "0");
    claritySetTag("page_type", ctx.page_type);
  } catch {
    // ignore
  }
}

function buildPayload(
  eventName: EventName,
  properties: TrackProperties,
  opts: { identityFree?: boolean },
): QueuedEvent {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const attr = getAttribution();
  const ctx = getDeviceContext(pathname);
  const {
    item_id,
    item_code,
    category_id,
    ...rest
  } = properties;

  const base: QueuedEvent = {
    event_name: eventName,
    client_ts: new Date().toISOString(),
    path: pathname.slice(0, 512),
    item_id: item_id ?? null,
    item_code: item_code ?? null,
    category_id: category_id ?? null,
    properties: sanitizeProperties(rest),
  };

  if (opts.identityFree) {
    return {
      ...base,
      anon_id: null,
      session_id: null,
      source: null,
      referrer_domain: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      first_utm_source: null,
      first_utm_medium: null,
      first_utm_campaign: null,
      device_type: null,
      os: null,
      browser: null,
      connection_type: null,
      language: null,
      viewport_w: null,
      viewport_h: null,
      is_returning: null,
      visit_count: null,
    };
  }

  return {
    ...base,
    anon_id: getAnonId() || null,
    session_id: getSessionId() || null,
    source: attr.source,
    referrer_domain: attr.referrer_domain,
    utm_source: attr.utm.utm_source ?? null,
    utm_medium: attr.utm.utm_medium ?? null,
    utm_campaign: attr.utm.utm_campaign ?? null,
    utm_content: attr.utm.utm_content ?? null,
    utm_term: attr.utm.utm_term ?? null,
    first_utm_source: attr.first_utm.utm_source ?? null,
    first_utm_medium: attr.first_utm.utm_medium ?? null,
    first_utm_campaign: attr.first_utm.utm_campaign ?? null,
    device_type: ctx.device_type,
    os: ctx.os,
    browser: ctx.browser,
    connection_type: ctx.connection_type,
    language: ctx.language,
    viewport_w: ctx.viewport_w,
    viewport_h: ctx.viewport_h,
    is_returning: isReturningVisitor(),
    visit_count: getVisitCount(),
  };
}

function scheduleFlush(): void {
  const q = getQueue();
  if (q.timer) return;
  q.timer = setTimeout(() => {
    q.timer = null;
    void flushQueue();
  }, FLUSH_MS);
}

export async function flushQueue(): Promise<void> {
  if (typeof window === "undefined") return;
  const q = getQueue();
  if (q.timer) {
    clearTimeout(q.timer);
    q.timer = null;
  }
  if (q.events.length === 0) return;
  if (!shouldSendNetwork()) {
    q.events = [];
    return;
  }

  const batch = q.events.splice(0, q.events.length);
  const body = JSON.stringify({ events: batch });
  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/track", blob);
      if (ok) return;
    }
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // drop — never block UI
  }
}

export function track(
  eventName: EventName | string,
  properties: TrackProperties = {},
): void {
  try {
    if (typeof window === "undefined") return;
    if (!EVENT_NAME_SET.has(eventName)) return;

    const isConsent = eventName === "consent_decision";
    const pathname = window.location.pathname;

    if (!isConsent) {
      if (isSkipPath(pathname)) return;
      if (!isAnalyticsAllowed()) return;
    }

    const payload = buildPayload(eventName as EventName, properties, {
      identityFree: isConsent,
    });

    if (!CLARITY_SKIP_EVENTS.has(eventName) && !isConsent) {
      if (isAnalyticsAllowed()) {
        clarityEvent(eventName);
      }
    }

    const q = getQueue();
    q.events.push(payload);
    if (q.events.length >= FLUSH_AT) {
      void flushQueue();
    } else {
      scheduleFlush();
    }
  } catch {
    // never throw to UI
  }
}

export function bindFlushLifecycle(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onHide = () => {
    if (document.visibilityState === "hidden") {
      void flushQueue();
    }
  };
  const onPageHide = () => {
    void flushQueue();
  };

  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onPageHide);
  return () => {
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onPageHide);
  };
}
