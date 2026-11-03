# TB-011 — Landing `/`

| Field | Value |
|-------|--------|
| **Status** | `todo` |
| **Depends on** | TB-010 |
| **S refs** | S1 |
| **Suggested PR title** | `feat(jobboard): caramel landing page` |
| **Repo** | DEBO (`next`) |

---

## Goal

`/` is a Debo Info–style marketing landing (hero + about) that sends visitors to `/jobs`. The catalogue must not load on this route.

## Scope

Presentational landing view + fixtures. Move the current job list **off** `/` so TB-012 can own `app/jobs/page.tsx`. If TB-012 is not done yet, temporarily keep the list behind a stub `/jobs` that reuses the existing list loader (minimal route move OK so `/` is free).

## Context

CRA reference: `origin/dev` `server/client/src/pages/Home/Home.jsx` (Hero, About, countries/activities). Visual: caramel tokens from TB-009. Copy is **offres d’emploi**, not UEMOA / tenders / « S’abonner ». Structure (hero, about, optional static cards) may follow Debo; CTAs go to `/jobs`.

Views must not import `lib/api` fetch or `useQuery`. No `JOBS_READ_KEY` on this page.

## Change

1. Add `components/home/landing-view.tsx` (+ `fixtures.ts`): Hero with primary CTA **Voir les offres** → `/jobs`; About block(s) using shadcn `Card` / `Button`.
2. Optional static country/activity cards (fixtures only, no API).
3. [`app/page.tsx`](../../../app/page.tsx) renders the landing view only (no `loadJobListPage`).
4. Fixture tests: CTA href `/jobs`; no job row `/jobs/<uuid>` required on landing.

## Acceptance

- Opening `/` does not call `listJobs` / `JOBS_API_URL`.
- Hero CTA links to `/jobs`.
- Copy does not promise tenders, UEMOA alerts, or paid subscribe.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Filter/list restyle (TB-012). Paiement. Fetching jobs on the landing.
