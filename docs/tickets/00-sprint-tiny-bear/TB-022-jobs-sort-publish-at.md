# TB-022 — Sort public jobs by `publish_at` desc

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-002 |
| **S refs** | S1, S6 |
| **Suggested PR title** | `fix(public-jobs): order by publish_at desc` |
| **Repo** | AI-scrapper |

---

## Goal

Catalogue list returns the newest offers first by **displayed** publication date (`payload.publish_at`), so `/jobs` and `/alerts` (both via `GET /api/public/jobs`) match user expectation of “plus récent d’abord”.

## Scope

Change list ordering in the public jobs pipeline only. No DEBO UI changes required.

## Context

Today [`admin/lib/pipeline/public-jobs.ts`](../../../../AI-scrapper/admin/lib/pipeline/public-jobs.ts) uses `.order("created_at", { ascending: false })`. The UI shows `publish_at`, so rows can look out of order. Wave 7 locked default: **`publish_at` desc, nulls/empty last**.

## Change

1. In `listPublicJobs` (or equivalent), order by `payload->>publish_at` descending.
2. Ensure null / empty `publish_at` sort after dated rows (nulls last).
3. Keep existing filters (`q`, `company`, `location`, `publish_after`, `limit`, `offset`) unchanged.
4. Update [`admin/tests/public-jobs-route.test.ts`](../../../../AI-scrapper/admin/tests/public-jobs-route.test.ts) to assert order by `publish_at` (not `created_at`).

## Acceptance

- List response items are ordered by `publish_at` newest → oldest.
- Rows without `publish_at` appear after dated rows.
- DEBO `/jobs` and `/alerts` inherit the order with no front change.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Client-side re-sort, new sort query params, changing filter semantics, DEBO-only patches.
