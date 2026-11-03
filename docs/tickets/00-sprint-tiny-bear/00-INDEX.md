# Job board — Tiny Bear ticket index

Source of truth: [`00-SPRINT-BRIEF.md`](./00-SPRINT-BRIEF.md).  
Conventions: [`CONVENTIONS.md`](./CONVENTIONS.md).  
Template: [`_TEMPLATE.md`](./_TEMPLATE.md).  
Shared Supabase: [`../../../../SOLINET-SHARED-SUPABASE.md`](../../../../SOLINET-SHARED-SUPABASE.md).

**How to run:** one chat/PR = one `TB-*` (or one `PI-*` in wave 6) when practical. TB-002 lands in **AI-scrapper**; other TB-* on DEBO `update-next`. Wave 6 PI-* execute in **solinet-pay-sms-scrapper** but follow this INDEX order.

---

## Waves

| Wave | Tickets | Notes |
|------|---------|--------|
| **1** | TB-001, TB-002 | Scaffold DEBO `next` and public jobs API can parallel |
| **2** | TB-003, TB-004 | Need TB-002 contract (mock OK for list/detail tests) |
| **3** | TB-005, TB-006, TB-007, TB-008 | Auth then SQL then UI ; TB-008 after schema name is real |
| **4** | TB-009, TB-010, TB-011, TB-012 | shadcn + chrome then landing then `/jobs` overview + fiche |
| **5** | TB-013, TB-014, TB-015, TB-016 | Landing notes, icons, CSS motion, then scroll reveal |
| **6** | TB-017 → TB-021, then PI-011 → PI-013 | Alerts/codes + wallet invoice gate (DEBO); APK silence/toggle/invalidate (pay-sms). **Execution SoT for this wave.** Freeze: [context.md](./context.md) |

Cross-repo PI tickets live under `solinet-pay-sms-scrapper/docs/tickets/00-sprint-sms-pay/` but **run in the wave 6 order above**.

---

## Backlog

| ID | Title | Status | Depends on | Repo | File |
|----|-------|--------|------------|------|------|
| TB-001 | Next.js scaffold on DEBO `next` | `done` | — | DEBO | [TB-001-next-scaffold.md](./TB-001-next-scaffold.md) |
| TB-002 | `GET /api/public/jobs` + `JOBS_READ_KEY` | `done` | — | AI-scrapper | [TB-002-public-jobs-api.md](./TB-002-public-jobs-api.md) |
| TB-003 | Job list + filters | `done` | TB-002 | DEBO | [TB-003-job-list.md](./TB-003-job-list.md) |
| TB-004 | Job detail `description_md` | `done` | TB-002 | DEBO | [TB-004-job-detail.md](./TB-004-job-detail.md) |
| TB-005 | Auth0 session | `done` | TB-001 | DEBO | [TB-005-auth0-session.md](./TB-005-auth0-session.md) |
| TB-006 | Schema `jobboard.favorites` | `done` | TB-001 | DEBO (SQL) | [TB-006-jobboard-favorites-sql.md](./TB-006-jobboard-favorites-sql.md) |
| TB-007 | Save/unsave favorites | `done` | TB-005, TB-006 | DEBO | [TB-007-favorites-ui.md](./TB-007-favorites-ui.md) |
| TB-008 | Registry + README pointers | `done` | TB-001 | DEBO + canon doc | [TB-008-registry-readme.md](./TB-008-registry-readme.md) |
| TB-009 | shadcn + caramel tokens | `done` | TB-001 | DEBO | [TB-009-shadcn-caramel-tokens.md](./TB-009-shadcn-caramel-tokens.md) |
| TB-010 | Header / footer chrome | `done` | TB-009 | DEBO | [TB-010-site-chrome.md](./TB-010-site-chrome.md) |
| TB-011 | Landing `/` | `done` | TB-010 | DEBO | [TB-011-landing.md](./TB-011-landing.md) |
| TB-012 | Overview `/jobs` + detail restyle | `done` | TB-003, TB-004, TB-010 | DEBO | [TB-012-jobs-overview-detail.md](./TB-012-jobs-overview-detail.md) |
| TB-013 | Landing sections from notes.md | `done` | TB-011 | DEBO | [TB-013-landing-notes-sections.md](./TB-013-landing-notes-sections.md) |
| TB-014 | Landing icons | `done` | TB-013 | DEBO | [TB-014-landing-icons.md](./TB-014-landing-icons.md) |
| TB-015 | Landing motion | `done` | TB-013 | DEBO | [TB-015-landing-motion.md](./TB-015-landing-motion.md) |
| TB-016 | Landing scroll reveal | `done` | TB-015 | DEBO | [TB-016-landing-scroll-reveal.md](./TB-016-landing-scroll-reveal.md) |
| TB-017 | Alerts activation SQL | `done` | TB-016 | DEBO (SQL) | [TB-017-alerts-activation-sql.md](./TB-017-alerts-activation-sql.md) |
| TB-018 | Wallet invoice / SMS reference gate | `done` | PI-006 | DEBO | [TB-018-wallet-invoice-gate.md](./TB-018-wallet-invoice-gate.md) |
| TB-019 | Alerts activate / request-code / invalidate APIs | `done` | TB-017 | DEBO | [TB-019-alerts-activation-api.md](./TB-019-alerts-activation-api.md) |
| TB-020 | Purchase shows one-shot activation code | `done` | TB-019, PI-009 | DEBO | [TB-020-purchase-emit-code.md](./TB-020-purchase-emit-code.md) |
| TB-021 | `/alerts` page | `done` | TB-019, TB-003 | DEBO | [TB-021-alerts-page.md](./TB-021-alerts-page.md) |
| PI-011 | APK silence unparsed SMS notify | `done` | PI-005 | pay-sms | [PI-011](../../../../solinet-pay-sms-scrapper/docs/tickets/00-sprint-sms-pay/PI-011-silence-unparsed-notify.md) |
| PI-012 | APK parse on/off toggle | `done` | PI-005 | pay-sms | [PI-012](../../../../solinet-pay-sms-scrapper/docs/tickets/00-sprint-sms-pay/PI-012-parse-toggle.md) |
| PI-013 | APK invalidate activation code | `done` | TB-019, PI-011 | pay-sms | [PI-013](../../../../solinet-pay-sms-scrapper/docs/tickets/00-sprint-sms-pay/PI-013-invalidate-activation-code.md) |

---

## S coverage

| S | Topic | Ticket(s) |
|---|--------|-----------|
| S0 | One Supabase instance | BRIEF, TB-006 |
| S1 | Catalogue = `items` jobs upserted | TB-002, TB-003, TB-004 |
| S2 | Auth0 visitors | TB-005 |
| S4 / S5 / S11 | Schema + RLS `auth0_sub` | TB-006, TB-007 |
| S6 | `JOBS_READ_KEY` public API | TB-002, TB-003 |
| S7 | No scrape from public site | BRIEF out of scope |
| S8 | New Auth0 Application | TB-005 |
| S9 / S10 | Names + SQL in front repo | TB-001, TB-006 |
| S12 | Product app playbook §5 | TB-006, TB-008, TB-013 |
| S4 / S10 | Alerts codes + filters SQL | TB-017 |
| S5 | Wallet invoice gate ; alerts session cookie | TB-018, TB-019 |
| S1 / S6 | `/alerts` matched jobs | TB-021 |
