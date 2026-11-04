export const SKIP_PATH_PREFIXES = ["/admin", "/auth"] as const;

export const EVENT_NAMES = [
  // P0
  "page_view",
  "cta_click",
  "outbound_click",
  "consent_decision",
  // Jobs UI
  "job_click",
  "job_view",
  "list_filter",
  "list_search",
  // P1 reserved
  "scroll_depth",
  "time_on_page",
  "nav_click",
  "not_found",
  "js_error",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export const EVENT_NAME_SET = new Set<string>(EVENT_NAMES);

/** High-frequency / noise — still stored in Supabase, skipped for Clarity.event. */
export const CLARITY_SKIP_EVENTS = new Set<string>([
  "page_view",
  "scroll_depth",
  "time_on_page",
]);

export function isSkipPath(pathname: string): boolean {
  return SKIP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
