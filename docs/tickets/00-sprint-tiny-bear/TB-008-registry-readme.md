# TB-008 — Registry + README pointers

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-001 |
| **S refs** | S12 |
| **Suggested PR title** | `docs(jobboard): registry and README pointers` |
| **Repo** | DEBO + `SOLINET-SHARED-SUPABASE.md` |

---

## Goal

Other AIs can find the job board as a product app on the shared instance without inventing a third Supabase project.

## Scope

Registre §8 in [`SOLINET-SHARED-SUPABASE.md`](../../../../SOLINET-SHARED-SUPABASE.md) and a short DEBO README note on branch `next`.

## Context

Playbook §5 step 10. `app_id` = `jobboard`, schema `jobboard`, scraper project `jobs`, repo DEBO. Auth0 app name TBD until TB-005 exists — leave TBD if not created yet, or fill if TB-005 already landed.

## Change

1. Set registry row: repo `DEBO`, schema `jobboard`, scraper project `jobs`, status `planned` or `sql_applied` if TB-006 is applied.
2. DEBO `README.md` on `next`: this is the **job board** (not tenders MERN); point to Tiny Bear INDEX and the canon doc; how to run `npm run dev`; env `JOBS_API_URL` / `JOBS_READ_KEY`.
3. Do not claim DEBO Info tenders Mongo is still the stack on `next`.

## Acceptance

- Registry table lists DEBO for `jobboard` (not TBD repo).
- README on `next` links `docs/tickets/00-sprint-tiny-bear/00-INDEX.md` and `SOLINET-SHARED-SUPABASE.md`.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Rewriting the MERN README on `main`. Creating the Auth0 Application (TB-005).
