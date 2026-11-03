# TB-015 — Landing motion

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-013 |
| **S refs** | S12 |
| **Suggested PR title** | `feat(jobboard): landing section motion` |
| **Repo** | DEBO (`next`) |

---

## Goal

Add as much tasteful motion as practical on `/` — section enter, card/CTA hover, light reveal — while respecting `prefers-reduced-motion` and keeping the hero readable (LCP-safe).

## Scope

CSS / Tailwind motion on the landing only. Prefer existing stack: Tailwind 4, `tw-animate-css` already in [`app/globals.css`](../../../app/globals.css). No heavy animation SDK unless already a DEBO dependency.

## Context

Stable section tree from TB-013 (icons from TB-014 may already be present — motion should not fight layout). Brand: caramel Debo, not FitApp purple/glow spam.

## Change

1. Section enter: subtle fade/slide (or opacity) when blocks enter the viewport **or** on first paint with staggered delays — pick one approach and document it in the PR.
2. Hover: cards and primary CTAs (scale/shadow/underline) without layout thrash.
3. Guarantee / plan / contact: light emphasis only (no infinite loops that distract from Formspree or `/pay`).
4. Honor `prefers-reduced-motion: reduce`: disable transforms/transitions or fall back to opacity-only / none.
5. Avoid animating the full-bleed hero background image in a way that hurts LCP; prefer animating text/CTA after paint.
6. Tests: if trivial, assert a `motion-safe:` / `motion-reduce:` class or CSS rule exists in globals or the landing module; otherwise manual smoke checklist in Acceptance.

## Acceptance

- Landing shows visible enter and/or hover motion on desktop with motion enabled.
- With OS « reduce motion », animations do not run (or are opacity-only).
- No new animation dependency required for a minimal pass; if one is added, justify in the PR and keep bundle impact small.
- Motion limited to `/` (not `/jobs` or `/pay` in this ticket).

---

## Definition of Done

- [ ] Change implemented as above
- [ ] Acceptance checks pass
- [ ] `00-INDEX.md` status updated for this ticket

## Out of scope

Lottie packs, video backgrounds, parallax-heavy hero, motion on catalogue/pay, copy/icon changes (TB-013 / TB-014).
