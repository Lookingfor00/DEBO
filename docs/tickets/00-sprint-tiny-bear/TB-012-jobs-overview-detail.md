# TB-012 — Overview `/jobs` + detail restyle

| Field | Value |
|-------|--------|
| **Status** | `todo` |
| **Depends on** | TB-003, TB-004, TB-010 |
| **S refs** | S1, S6 |
| **Suggested PR title** | `feat(jobboard): caramel jobs overview and detail` |
| **Repo** | DEBO (`next`) |

---

## Goal

The filtered catalogue lives at `/jobs` with Debo caramel overview chrome (cards, empty, pagination). The fiche at `/jobs/[id]` matches that chrome. Filters stay GET + server fetch (no in-memory dump).

## Scope

Move [`app/page.tsx`](../../../app/page.tsx) list to `app/jobs/page.tsx`. Restyle [`job-list-view.tsx`](../../../components/jobs/job-list-view.tsx) and [`job-detail-view.tsx`](../../../components/jobs/job-detail-view.tsx) with shadcn. Loaders (`load-job-list-page`, `load-job-detail-page`) and `lib/api/jobs.ts` stay as TB-003/004.

## Context

CRA overview: `origin/dev` `server/client/src/pages/Tender/Tenders.jsx` + [`../../utils/Server/tenders.css`](../../utils/Server/tenders.css) (page bg `#FAF4EC`, white sections, `#803D3B` titles). Detail was often inline in `Tender.jsx`; this product keeps a dedicated `/jobs/[id]`. Markdown still `react-markdown`, never `dangerouslySetInnerHTML`. Favorite toggle stays (TB-007). Prefer shadcn `Field`/`Input`/`Button`, `Card`, `Empty`, `Pagination`, `Badge`, `Separator`.

## Change

1. `app/jobs/page.tsx` : same `searchParams` + `loadJobListPage` as today’s home list.
2. GET filter form (`q`, `company`, `location`, `publish_after`) with shadcn fields; pagination links keep `offset`.
3. Rows as `Card` (or equivalent) linking `/jobs/<id>`; `Empty` when no hits; error + retry.
4. Detail: `Card` + `Badge` meta + `Separator` + existing markdown; back link to `/jobs` (preserve query if cheap).
5. Update list/detail fixture tests: `/jobs/<id>` still present; no raw HTML from markdown payload.

## Acceptance

- `/` is not the catalogue (TB-011). `/jobs` lists jobs; changing filters still hits the public API.
- Detail 404 for unknown id unchanged.
- No `#4294E3` in these views; caramel theme tokens used via shadcn.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

New API fields. Paiement. Hide offre. Client `useQuery` for the catalogue.
