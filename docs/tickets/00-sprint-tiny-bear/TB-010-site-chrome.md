# TB-010 — Header / footer chrome

| Field | Value |
|-------|--------|
| **Status** | `todo` |
| **Depends on** | TB-009 |
| **S refs** | S2 |
| **Suggested PR title** | `feat(jobboard): Debo caramel site chrome` |
| **Repo** | DEBO (`next`) |

---

## Goal

Replace the minimal header with Debo Info caramel chrome (navbar + footer) while keeping the existing Auth0 login/logout session (server `sub` never in HTML).

## Scope

[`components/layout/site-header-view.tsx`](../../../components/layout/site-header-view.tsx) + a presentational footer view. shadcn `Button` / `NavigationMenu` or `Sheet`. Logo from Git history, not a full-branch checkout.

## Context

CRA reference (read-only): `origin/dev` `server/client/src/components/Navbar/NavBar.jsx` + `NavBar.css` (bar `#803D3B`, white links). CSS copy on this branch: [`../../utils/Server/nav-bar.css`](../../utils/Server/nav-bar.css). Auth0 stays `@auth0/nextjs-auth0` (`/auth/login`, `/auth/logout`) — not `@auth0/auth0-react`.

Restore logo files with `git show origin/dev:server/client/public/images/…` into `public/` (e.g. `logowhite.png`). Do **not** `git checkout` `main` / `dev`.

## Change

1. Header: logo + title, links **Accueil** (`/`) and **Offres** (`/jobs`), Connexion / hint + Déconnexion as today (no `sub` in markup).
2. Compose with shadcn primitives; mobile menu via `Sheet` if `NavigationMenu` is too wide.
3. Footer: compact Debo contact/legal strip (no payment CTA).
4. Wire in [`app/layout.tsx`](../../../app/layout.tsx).
5. Fixture tests (`renderToStaticMarkup`): anonymous login href; authenticated logout href; no `auth0|`.

## Acceptance

- Navbar uses caramel primary (theme `bg-primary`), not FitApp blue.
- `/auth/login` and `/auth/logout` still work; catalogue pages remain public.
- View tests cover anonymous vs authenticated chrome.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Landing sections (TB-011). Restyling job cards (TB-012). Paiement / tarifs.
