import { z } from "zod";

import { EVENT_NAME_SET } from "@/lib/analytics/events";

const FORBIDDEN_PROPERTY_KEYS = new Set([
  "email",
  "phone",
  "msisdn",
  "password",
  "token",
  "authorization",
  "user_agent",
  "ua",
  "ip",
]);

const EMAIL_LIKE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export const trackEventSchema = z.object({
  event_name: z
    .string()
    .max(64)
    .refine((name) => EVENT_NAME_SET.has(name), "unknown_event"),
  client_ts: z.string().datetime().optional().nullable(),
  anon_id: z.string().uuid().optional().nullable(),
  session_id: z.string().uuid().optional().nullable(),
  path: z.string().max(512).optional().nullable(),
  item_id: z.string().uuid().optional().nullable(),
  item_code: z.string().max(128).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  referrer_domain: z.string().max(120).optional().nullable(),
  utm_source: z.string().max(120).optional().nullable(),
  utm_medium: z.string().max(120).optional().nullable(),
  utm_campaign: z.string().max(120).optional().nullable(),
  utm_content: z.string().max(120).optional().nullable(),
  utm_term: z.string().max(120).optional().nullable(),
  first_utm_source: z.string().max(120).optional().nullable(),
  first_utm_medium: z.string().max(120).optional().nullable(),
  first_utm_campaign: z.string().max(120).optional().nullable(),
  device_type: z.string().max(32).optional().nullable(),
  os: z.string().max(32).optional().nullable(),
  browser: z.string().max(32).optional().nullable(),
  connection_type: z.string().max(32).optional().nullable(),
  language: z.string().max(16).optional().nullable(),
  viewport_w: z.number().int().min(0).max(10000).optional().nullable(),
  viewport_h: z.number().int().min(0).max(10000).optional().nullable(),
  is_returning: z.boolean().optional().nullable(),
  visit_count: z.number().int().min(0).max(100000).optional().nullable(),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
});

export const trackBatchSchema = z.object({
  events: z.array(trackEventSchema).min(1).max(25),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;

export function sanitizeProperties(
  input: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!input) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_PROPERTY_KEYS.has(lower)) continue;
    if (typeof value === "string") {
      if (EMAIL_LIKE.test(value)) continue;
      out[key] = value.slice(0, 200);
      continue;
    }
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      out[key] = value;
    }
  }
  return out;
}
