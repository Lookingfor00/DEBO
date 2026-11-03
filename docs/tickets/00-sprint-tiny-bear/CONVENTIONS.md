# Ticket conventions — job board Tiny Bear

Sprint brief: [`00-SPRINT-BRIEF.md`](./00-SPRINT-BRIEF.md).  
Canon: [`../../../../SOLINET-SHARED-SUPABASE.md`](../../../../SOLINET-SHARED-SUPABASE.md) (S0–S12).  
Cursor rule: [`../../../../.cursor/rules/solinet-shared-supabase.mdc`](../../../../.cursor/rules/solinet-shared-supabase.mdc).

## Two repos

| Repo | Branch | This sprint |
|------|--------|-------------|
| **DEBO** | `update-next` (grill name: `next`) | Next.js App Router at **repo root** (MERN on `main` frozen) |
| **AI-scrapper** | existing | `GET /api/public/jobs` only (TB-002) |

Ticket files live **only** here. TB-002 is still executed in AI-scrapper.

## Product vs scraper

| Term | Value |
|------|--------|
| Product app `app_id` | `jobboard` |
| Postgres schema | `jobboard` (not `public`, not `jobs`) |
| Scraper project | `jobs` (`public.items.project`) |
| Catalogue | upserted rows only |

`jobs` is a **scraper project**. `jobboard` is the **product schema**. Do not create schema `jobs`.

## Next.js paths (DEBO `next`, locked for ticket text)

Follow architecture-layers: `lib/api` → `hooks/resources` → `hooks/pages` → `components/*-view`.

```text
app/
  page.tsx                         # landing (TB-011)
  jobs/page.tsx                    # job list / overview (TB-012)
  jobs/[id]/page.tsx               # job detail (TB-004, restyle TB-012)
  api/favorites/route.ts           # save/unsave (TB-007)
lib/api/                           # HTTP to public jobs API + favorites
lib/mappers/
hooks/resources/
hooks/pages/
components/ui/                     # shadcn (TB-009)
components/layout/                 # header / footer views (TB-010)
components/jobs/                   # *-view.tsx + fixtures.ts
docs/sql/001_jobboard_favorites.sql
.env.example                       # Auth0 public + JOBS_API_URL / JOBS_READ_KEY server-only
```

## AI-scrapper path (TB-002)

```text
admin/app/api/public/jobs/route.ts
admin/tests/public-jobs-route.test.ts
```

Bearer `JOBS_READ_KEY`. Force `project=jobs` and `status=upserted`. Query: `q`, `company`, `location`, `publish_after`, `limit`, `offset`. Client must not choose `project`.

## Env (DEBO)

| Var | Where | Notes |
|-----|--------|--------|
| `JOBS_API_URL` | server | AI-scrapper origin + `/api/public/jobs` |
| `JOBS_READ_KEY` | server | never `NEXT_PUBLIC_*` |
| Auth0 domain / client id | public OK | new Application, Solinet tenant |
| Auth0 secret | server | |
| Supabase service role / `SCRAPER_RUN_KEY` | **never** | S6, S7 |

## Ticket workflow

1. One chat/PR = **one TB-*** when practical. TB-002 PR is on AI-scrapper.
2. Prefer TDD (Vitest) when adding API or mapper behavior.
3. Mark `done` only when Acceptance + DoD pass.
4. Update `00-INDEX.md` status.

## Status enum

`todo` | `in_progress` | `done` | `blocked`

## ID scheme

`TB-NNN` — Tiny Bear (job board), zero-padded.
