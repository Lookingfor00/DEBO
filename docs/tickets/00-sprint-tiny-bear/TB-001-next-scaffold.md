# TB-001 — Next.js scaffold on DEBO `next`

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | — |
| **S refs** | S9 |
| **Suggested PR title** | `feat(jobboard): Next.js App Router scaffold` |
| **Repo** | DEBO (`next`) |

---

## Goal

Replace the MERN tree **on branch `next` only** with a Next.js App Router app at repo root so later TB tickets have a place to land.

## Scope

DEBO branch `next`: `package.json`, App Router, TypeScript, Tailwind, Vitest, `.env.example`. `main` MERN stays frozen.

## Context

Grill: App Router at DEBO root; no `server/` + CRA `client/` on `next`. Layers: [`CONVENTIONS.md`](./CONVENTIONS.md). Do not add product list UI here (TB-003).

## Change

1. Create/reset branch `next` from current DEBO default as needed; on `next`, remove Express/CRA as the runnable app (leave git history on `main`).
2. Scaffold Next.js (App Router, TS, Tailwind) at repo root.
3. Add Vitest (`npm test`) with one smoke test so CI has a command.
4. Add `.env.example`: Auth0 placeholders, `JOBS_API_URL`, `JOBS_READ_KEY` (no `NEXT_PUBLIC_` on the read key). Document “never service_role / SCRAPER_RUN_KEY”.
5. Root page can be a placeholder (“Job board”) — no catalogue fetch.

## Acceptance

- `npm test` and `npm run build` succeed on `next`.
- `.env.example` lists `JOBS_READ_KEY` without `NEXT_PUBLIC_` prefix.
- `main` still has the MERN app.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Auth0 wiring (TB-005), list/detail (TB-003/004), SQL (TB-006), AI-scrapper routes.
