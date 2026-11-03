# TB-013 — Landing sections from notes.md

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-011 |
| **S refs** | S12 |
| **Suggested PR title** | `feat(jobboard): landing problem solution team guarantee plans` |
| **Repo** | DEBO (`next`) |

---

## Goal

Enrich `/` with marketing sections from [`../../../../docs/notes.md`](../../../../docs/notes.md) (Problème, Solution, Qui nous sommes, Garantie renforcée, Plan à prix réels) so visitors understand the pitch and can move to `/pay` or `/jobs`. Keep the existing hero, « Comment nous rejoindre… », and contact Formspree.

## Scope

Presentational sections under `components/home/` (+ fixtures). Server page may load **enabled plans** the same way `/pay` does (`listEnabledPlans` / pay page loader). No catalogue fetch. No Auth0 changes. No new SQL.

## Context

Copy source of truth: workspace [`docs/notes.md`](../../../../docs/notes.md) (ton léger, confiant). Existing landing: [`landing-view.tsx`](../../../components/home/landing-view.tsx), [`fixtures.ts`](../../../components/home/fixtures.ts), [`app/page.tsx`](../../../app/page.tsx). Plans API: [`lib/api/plans.ts`](../../../lib/api/plans.ts). Refund stub: `/remboursement`. Architecture: views + fixtures; no `useQuery` for catalogue; no `JOBS_READ_KEY` / `service_role` in client.

## Change

1. Extend fixtures from `docs/notes.md` (problem bullets, solution bullets, team bios Allassane Full Stack + Mahamane Génie civil, guarantee body, plan section copy). Minor FR typo fixes OK in impl.
2. Compose section views (or one expanded `LandingView`) in this **page order**:
   Hero (existing) → Comment rejoindre (existing) → **Problème** → **Solution** → **Qui nous sommes** → **Garantie** (replace/extend the current checkmark line with the notes body + link `formulaire` → `/remboursement`) → **Plan** → Contact (existing) → Footer (layout).
3. Qui nous sommes: show names + roles; photos at `public/images/team/` (placeholders acceptable if final assets missing).
4. Plan section: load **enabled** plans server-side (same stack as `/pay`); display duration + `price_xof` from DB — never invent prices; empty state if none; CTA **Voir les plans et payer** → `/pay`.
5. Pass plan VMs into the landing view as props from `app/page.tsx` (or a thin home loader). Do not call `listJobs`.
6. Vitest: key section titles from notes; guarantee link `/remboursement`; plan card or empty; `/` still free of `loadJobListPage` / `listJobs`.

## Acceptance

- `/` renders the five new content blocks in the order above (or clearly labeled equivalents).
- Plan prices match enabled rows from `jobboard.plans` (or empty state); CTA goes to `/pay`.
- Guarantee text links to `/remboursement`.
- Opening `/` still does not call the public jobs catalogue.
- Copy stays job-board / WhatsApp premium — not UEMOA tenders.

---

## Definition of Done

- [ ] Change implemented as above
- [ ] Acceptance checks pass
- [ ] `00-INDEX.md` status updated for this ticket

## Out of scope

Dense icon pass (TB-014). Motion (TB-015). Full refund form backend. WhatsApp delivery pipeline. Header/footer redesign. New SQL.
