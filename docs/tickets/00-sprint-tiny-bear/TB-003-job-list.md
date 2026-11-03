# TB-003 — Job list + filters

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-002 |
| **S refs** | S1, S6 |
| **Suggested PR title** | `feat(jobboard): job list and filters` |
| **Repo** | DEBO (`next`) |

---

## Goal

Visitors browse upserted jobs with title/company/location/date filters without loading the full catalogue in the browser.

## Scope

List route: `lib/api` fetch to `JOBS_API_URL`, mapper, page hook, `components/jobs/*-view.tsx`. Query params map to the public API.

## Context

API contract from TB-002. Views must not import `lib/api` fetch or `useQuery` (architecture-layers). View tests use fixtures only. `JOBS_READ_KEY` only in server code (Route Handler or server component fetch) — never client bundle.

## Change

1. Server-side list fetch with Bearer `JOBS_READ_KEY`; forward `q`, `company`, `location`, `publish_after`, `limit`, `offset`.
2. URL search params on `app/page.tsx` stay in sync with those filters + pagination.
3. Mapper: API DTO → list view-model (`title`, `company`, `location`, `publish_at`, href `/jobs/[id]`).
4. Empty and error+retry UI.
5. View tests with fixtures; mapper unit tests.

## Acceptance

- Changing filters updates the query string and triggers a new server request (no in-memory filter of a full dump).
- Missing `JOBS_READ_KEY` does not leak into client JS (grep / bundle check or test).
- Fixture view renders a row linking to `/jobs/<id>`.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Detail page (TB-004), Auth0, favorites. Client-side filtering of all items.
