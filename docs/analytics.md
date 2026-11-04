# DEBO analytics

Dual pipeline: **Microsoft Clarity** (session UX) + first-party **Supabase** events in `jobboard.analytics_events`.

## Consent

- Mode: opt-out (`CONSENT_MODE` in `lib/consent/cookie-consent.ts`)
- Storage key: `solinet-jobs-cookie-consent`
- Track by default until the visitor turns analytics off
- Refuse → purge `kf_*` identity keys, then reload
- Skip paths: `/admin`, `/auth`

## Clarity

- Env: `NEXT_PUBLIC_CLARITY_PROJECT_ID`
- Init once when allowed; identify with anon id + session tags
- High-frequency events (`page_view`, …) are skipped for `Clarity.event` but still stored in Supabase

## Supabase ingest

- Table: `jobboard.analytics_events` (SQL: `docs/sql/009_jobboard_analytics_events.sql`)
- Client: `POST /api/track` → `createJobboardClient()` (service role)
- Kill switch: `ANALYTICS_INGEST_DISABLED=true` → 204, no write
- Dev: network ingest only when `NEXT_PUBLIC_ANALYTICS_DEBUG=true`
- Origin allowlist: `NEXT_PUBLIC_SITE_URL`, localhost, `*.vercel.app`
- Retention helper: `jobboard.purge_old_analytics()` (25 months)
- Anon / authenticated: no grants (RLS on, no policies)

## Events (this product)

| Event | Source |
| --- | --- |
| `page_view` | AnalyticsProvider |
| `consent_decision` | Cookie banner (identity-free) |
| `cta_click` | TrackedLink / TrackedAnchor |
| `outbound_click` | WhatsApp, job source URL (kind + domain only) |
| `nav_click` | Header nav |
| `job_click` | Job list row |
| `job_view` | Job detail |
| `list_filter` / `list_search` | Jobs filter form (`q` ≥ 2 for search) |

Never put email, phone, IP, or raw User-Agent in event properties or Clarity.

## UTM convention

```text
?utm_source=<channel>&utm_medium=<medium>&utm_campaign=<name>_<moisAA>&utm_content=<variant>
```

- First touch → `localStorage` `kf_utm_first` (once)
- Last touch → `sessionStorage` `kf_utm_last`
- Without UTM, `source` is deduced from referrer domain

## Out of scope (this pass)

Download leads, admin stats / CSV.
