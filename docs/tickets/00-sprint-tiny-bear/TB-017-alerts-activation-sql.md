# TB-017 — Alerts activation SQL (`jobboard`)

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-016, PI-001 |
| **S refs** | S0, S4, S5, S10, S11 |
| **Suggested PR title** | `feat(jobboard): activation codes and alert filters SQL` |
| **Repo** | DEBO (`update-next`) SQL |

---

## Goal

Add `jobboard` tables for one-shot activation codes, phone bindings, and keyword filters so later APIs can gate `/alerts` without Auth0 on that surface.

## Scope

One SQL migration under `docs/sql/` (e.g. `007_jobboard_alerts_activation.sql`) + tests that the file exists and asserts required columns/constraints. No Route Handlers, no UI.

## Context

Freeze: [`context.md`](./context.md). Canon: [`../../../../SOLINET-SHARED-SUPABASE.md`](../../../../SOLINET-SHARED-SUPABASE.md). Same Supabase instance `ai-scrapper`; schema `jobboard` only.

V1 alert list = jobs matched on the fly from saved keywords (no push inbox table required unless a tiny stub is cleaner — prefer **no** inbox table in this ticket).

## Change

1. Tables (names may vary; intent locked):
   - **activation_codes** — code value (store hash if practical), status (`available` / `used` / `invalidated`), `used_at`, `invalidated_at`, optional link to purchaser `auth0_sub` / wallet msisdn, created_at. One logical emit per purchase handled later in TB-020.
   - **phone_activations** — `msisdn`, `activation_code_id`, `activated_at`; enforce one successful use path per code; support invalidate → no further access.
   - **alert_filters** — keyed by activated phone (or activation id), `keywords` (text/array), updated_at.
2. RLS / grants: visitors do not use Auth0 JWT on this surface — prefer **no anon writes**; server Route Handlers (TB-019) will use a privileged server client with explicit filters (same v1 pattern as favorites). Document that in SQL comments. Do not put `service_role` in the browser.
3. Revoke broad `anon` / `authenticated` writes on new tables (S11).
4. Vitest: SQL file content assertions (tables, status values, no `public.` product tables).

## Acceptance

- Migration file present under `DEBO/docs/sql/`.
- Codes can be marked used / invalidated; filters store keywords only.
- INDEX status → `done` after apply note in registry if SQL is applied in the same PR ops step (or leave `todo` until applied — ticket DoD includes file + tests; registry update when applied).

---

## Definition of Done

- [ ] Change implemented as above
- [ ] Acceptance checks pass
- [ ] `00-INDEX.md` status updated for this ticket

## Out of scope

Route Handlers, `/alerts` UI, invoice gate (TB-018), APK, Web Push, OTP, third Supabase project.
