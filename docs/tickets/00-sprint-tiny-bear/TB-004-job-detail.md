# TB-004 — Job detail `description_md`

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-002 |
| **S refs** | S1 |
| **Suggested PR title** | `feat(jobboard): job detail markdown` |
| **Repo** | DEBO (`next`) |

---

## Goal

Show one offer’s body as sanitized markdown (`description_md`), 404 if the id is not a jobs upserted item.

## Scope

`app/jobs/[id]/page.tsx` + detail view. Reuse public API get-by-id from TB-002.

## Context

Jobs schema requires `description_md` (never raw HTML). Admin already renders markdown for jobs items — same safety idea, public site. List (TB-003) can ship in parallel with a stub link.

## Change

1. Server fetch job by id with `JOBS_READ_KEY`; 404 on missing / non-jobs / non-upserted.
2. Render `title`, `company`, `location`, `publish_at`, `source_url`, `description_md` (markdown component, no `dangerouslySetInnerHTML` of HTML from payload).
3. Back link to list.
4. View fixture test.

## Acceptance

- Unknown id → 404.
- Markdown headings/lists from `description_md` render; HTML tags in payload are not executed as HTML.
- Detail does not call VPS or operator APIs.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Favorites button (TB-007). Tenders payload.
