# TB-023 — Alerts Web Push MVP (test keyword filters)

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-021 |
| **S refs** | S0, S4, S10, S11 |
| **Suggested PR title** | `feat(jobboard): web push for alerts keyword matches` |
| **Repo** | DEBO (`update-next`) |

---

## Goal

Browser Web Push on `/alerts` so an activated user with keyword filters can receive a notification when a matching job appears — MVP to **test filters** end-to-end (not WhatsApp / native).

## Scope

One MVP: subscribe UI + persistence + server dispatch for new keyword matches. Product SQL in `DEBO/docs/sql/` on schema `jobboard` (ai-scrapper instance).

## Context

Wave 6 freeze had Web Push “hors V1”. Wave 7 amends: **browser Web Push in scope**; WhatsApp stays out. Identity remains phone + activation code (alerts session cookie), not Auth0. Matching = same keywords as TB-021 / `listJobs({ q })`.

## Change

1. **SQL** (`docs/sql/010_…` or next free number): `jobboard.push_subscriptions` with `endpoint`, `p256dh`, `auth`, `phone_activation_id` (FK or stable id link to alerts activation), timestamps; optional dedupe cursor / last-notified helper columns as needed. RLS on; revoke all from `anon` / `authenticated`; grant insert/select/update/delete to `service_role` / `jobboard_app` like other alerts tables. No engine `public.items` writes.
2. **VAPID**: server private key + public key. Public half only via `NEXT_PUBLIC_VAPID_PUBLIC_KEY` or a small Route Handler; never put private key in `NEXT_PUBLIC_*`. Document in `.env.example`.
3. **Client**: service worker + subscribe / unsubscribe on `/alerts` when alerts session is valid and keywords are non-empty. Permission prompt only after user action.
4. **API**: persist / remove subscription bound to current alerts identity (session cookie). Reject unauthenticated alerts session.
5. **Dispatch**: cron-safe or secret-protected server job on DEBO that:
   - loads subscriptions + keyword filters;
   - queries matched upserted jobs (reuse `JOBS_READ_KEY` / same match as `/alerts`);
   - sends Web Push for **new** matches since last cursor;
   - dedupes per `(subscription, item_id)`;
   - notification opens `/jobs/[id]` or `/alerts`.
6. Tests: SQL grants/RLS shape; subscribe requires session; dispatch skips when no keywords; no PII in push payload beyond job title/id/url.

## Acceptance

- Activated user with keywords can enable browser notifications from `/alerts`.
- When a new matching job appears and dispatch runs, the browser shows a notification linking to the job or alerts page.
- Without alerts session or without keywords, no subscription write / no push.
- WhatsApp and native push are absent.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [ ] SQL applied note / registry if required by playbook — **apply `docs/sql/010_jobboard_push_subscriptions.sql` on ai-scrapper**
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

WhatsApp delivery, FCM / native apps, admin blast UI, Auth0-gated push, changing keyword match semantics, marketing campaigns.
