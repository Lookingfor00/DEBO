# TB-002 — `GET /api/public/jobs` + `JOBS_READ_KEY`

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | — |
| **S refs** | S1, S6 |
| **Suggested PR title** | `feat(admin): public jobs catalogue API` |
| **Repo** | AI-scrapper |

---

## Goal

Give the job board a **bounded** read of scraped offers without operator JWT or `service_role` in DEBO.

## Scope

`admin/app/api/public/jobs/route.ts` + Vitest. Implement in **AI-scrapper**; this ticket file stays in DEBO docs.

## Context

S6: server secret `JOBS_READ_KEY`. Force `project = 'jobs'` and `status = 'upserted'`. Ignore any client `project` query. Payload fields from [`AI-scrapper/worker/projects/jobs/schema.json`](../../../../AI-scrapper/worker/projects/jobs/schema.json): `title`, `source_url`, `external_id`, `publish_at`, `description_md`, `company`, `location`, `deadline`.

Existing operator items API is **not** this route (operator RLS, mixed projects).

## Change

1. Add `GET /api/public/jobs` requiring `Authorization: Bearer $JOBS_READ_KEY` (401/403 otherwise).
2. Query params: `q` (title ilike), `company`, `location`, `publish_after` (`YYYY-MM-DD` on payload `publish_at`), `limit` (cap e.g. 50), `offset`.
3. Always `.eq('project','jobs').eq('status','upserted')`. Never honor `?project=`.
4. Optional `GET /api/public/jobs/[id]` or `?id=` for detail — same auth + same project/status force; 404 if missing or wrong project.
5. Response DTO: id, source_url, payload fields needed by list/detail — no reject traces, no tenders, no pipeline.
6. Vitest: reject bad bearer; strip `project` query; pagination; filters.

## Acceptance

- Tests fail closed without key; with key, only jobs upserted rows.
- Passing `?project=tenders` still returns jobs-only (or empty), never tenders.
- Admin `.env.example` documents `JOBS_READ_KEY` (distinct from `SCRAPER_RUN_KEY`).

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

DEBO UI. Enqueue `/run`. Favorites. Changing `worker/sql/001*`.
