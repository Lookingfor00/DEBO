# TB-005 — Auth0 session

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-001 |
| **S refs** | S2, S8 |
| **Suggested PR title** | `feat(jobboard): Auth0 visitor session` |
| **Repo** | DEBO (`next`) |

---

## Goal

Visitors log in with Auth0 so later favorites can key off `sub` (`auth0|…`). No scrape Supabase Auth users.

## Scope

New Auth0 **Application** (Solinet tenant) + Next.js session (`@auth0/nextjs-auth0` or equivalent App Router SDK). Login / logout / callback on DEBO `next`.

## Context

S2 / S8: do **not** reuse the old DEBO CRA Client ID. Same tenant is OK. `sub` is the stable id for TB-006/007. Catalogue stays public without login.

## Change

1. Create Auth0 Application; set callback/logout URLs for local + Vercel placeholder.
2. Wire App Router auth routes; env in `.env.example` (client id public, secret server-only).
3. Header: login when anonymous; user hint + logout when authenticated. Expose `sub` only on the server for Route Handlers.
4. Do not create rows in `auth.users` of instance `ai-scrapper`.

## Acceptance

- Unauthenticated visitor still sees the job list.
- Login round-trip sets a session; logout clears it.
- Documented: new Application, not the CRA SPA client.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Favorites table/UI (TB-006/007). Custom password unwrap (S3 forbidden).
