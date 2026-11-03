# TB-009 — shadcn + caramel tokens

| Field | Value |
|-------|--------|
| **Status** | `todo` |
| **Depends on** | TB-001 |
| **S refs** | S9 |
| **Suggested PR title** | `feat(jobboard): shadcn and caramel tokens` |
| **Repo** | DEBO (`next`) |

---

## Goal

Install shadcn on the job board and map semantic colors to the Debo Info caramel/brown palette so later chrome, landing, and job views do not invent a third look.

## Scope

`npx shadcn@latest init` (Tailwind 4) into `components/ui/`. CSS variables only. No landing or job-list restyle in this ticket.

## Context

Visual lock: Debo Info **caramel**, not FitApp blue-violet. Source tokens in [`../../utils/Server/style.css`](../../utils/Server/style.css):

| Token | Hex |
|-------|-----|
| `--primary-dark-color` | `#5D3E30` |
| `--primary-color` | `#803D3B` |
| `--secondary-color` | `#F1E1CE` |
| `--secondary-light-color` | `#FAF4EC` |
| `--placeholder-color` | `#EBE0E0` |

Do **not** `git checkout` `main`. Do not copy Bootstrap. Use shadcn CLI components; semantic classes (`bg-primary`, `bg-background`), not raw `bg-[#803D3B]` in views.

## Change

1. Init shadcn (`components.json`, `components/ui/`, `lib/utils.ts` `cn` if missing).
2. Map shadcn theme CSS variables in `app/globals.css` to the caramel table above (`primary` → `#803D3B`, page background toward `#FAF4EC`, muted/cream `#F1E1CE`).
3. Add via CLI: `button`, `card`, `input`, `badge`, `separator`, `empty`, `pagination`, plus `navigation-menu` **or** `sheet` (mobile nav for TB-010).
4. Optional: Heebo + Jost via `next/font` (same families as Debo Info).
5. Test or grep: caramel hexes present; **no** `#4294E3` / `#8F12FD` in `app/` or `components/`.

## Acceptance

- `components.json` exists; listed primitives live under `components/ui/`.
- Theme uses Debo caramel tokens as shadcn semantic colors.
- No FitApp blue-violet in new theme files.
- Existing list/detail still render (unstyled-or-themed is OK; layout routes unchanged).

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

Header/footer (TB-010), landing (TB-011), moving the list to `/jobs` (TB-012). Bootstrap, paiement.
