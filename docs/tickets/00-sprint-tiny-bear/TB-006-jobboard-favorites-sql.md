# TB-006 — Schema `jobboard.favorites`

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-001 |
| **S refs** | S0, S4, S5, S10, S11, S12 |
| **Suggested PR title** | `feat(jobboard): favorites schema SQL` |
| **Repo** | DEBO (`docs/sql/`) — apply on instance `ai-scrapper` |

---

## Goal

Persist save/unsave per visitor on the shared Solinet instance without touching scrape engine tables.

## Scope

Versioned SQL in **DEBO** `docs/sql/001_jobboard_favorites.sql`. Playbook §5. Do not add files under `AI-scrapper/worker/sql/`.

## Context

Canon §5: schema = `app_id` (`jobboard`). Column `auth0_sub text not null`. RLS policy `auth0_sub = (auth.jwt() ->> 'sub')`. v1 Route Handlers may still filter `.eq('auth0_sub', sub)` after Auth0 verify (TB-007). Read-only UUID reference to `public.items.id` is OK; **no** trigger writing `items`.

## Change

1. `create schema if not exists jobboard;` + revoke from `public`/`anon` as in canon §5.
2. Table `jobboard.favorites`: `id`, `auth0_sub text not null`, `item_id uuid not null`, `created_at`; unique `(auth0_sub, item_id)`.
3. Enable (and force if exposed) RLS; owner policy on `auth0_sub`.
4. No `GRANT` write to `anon`. Do not `GRANT SELECT` on this schema to scrape operators unless an ops note is added.
5. After apply: note date in SOLINET registry (TB-008 can stamp `sql_applied`).

## Acceptance

- SQL file exists in DEBO `docs/sql/` and does not `ALTER`/`DROP` `public.items` / `jobs` / `pipeline_*`.
- Applying on a copy/dev instance creates schema `jobboard` only.
- Unique prevents duplicate favorites for the same `sub` + item.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Applying to production without operator OK. Favorites UI (TB-007). Hide-offer table.
