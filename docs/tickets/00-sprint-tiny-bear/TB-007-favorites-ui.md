# TB-007 — Save/unsave favorites

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-005, TB-006 |
| **S refs** | S5 |
| **Suggested PR title** | `feat(jobboard): save and unsave favorites` |
| **Repo** | DEBO (`next`) |

---

## Goal

Logged-in visitors save and remove a job; rows are always scoped to Auth0 `sub`.

## Scope

`app/api/favorites/route.ts` (or equivalent) + save control on detail (and list if cheap). Server verifies Auth0 JWT then `.eq('auth0_sub', sub)`.

## Context

v1: Next Route Handler, not third-party Auth on PostgREST yet (canon §3). Never use scrape `service_role` from the browser. No hide-offer.

## Change

1. POST save / DELETE unsave (or toggle) with `item_id`; reject anonymous (401).
2. Always set `auth0_sub` from the verified session `sub` — ignore client-supplied sub.
3. GET list of favorite item ids for the current `sub` (for button state).
4. Detail (TB-004) shows save when authenticated; CTA login when not.
5. Tests: cannot write another user’s `auth0_sub`; unauthenticated cannot write.

## Acceptance

- Two Auth0 subjects cannot see or delete each other’s rows (handler tests with fake sub).
- Favorite is a `jobboard.favorites` row, not a copy of `items.payload`.
- No `SCRAPER_RUN_KEY` / service_role in this route.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Hidden jobs, alerts, email. Third-party Auth0 JWT to PostgREST (later).
