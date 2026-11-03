# TB-016 — Landing scroll reveal

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-015 |
| **S refs** | S12 |
| **Suggested PR title** | `feat(jobboard): landing scroll reveal with motion` |
| **Repo** | DEBO (`next`) |

---

## Goal

Replace TB-015 first-paint CSS enter animations on `/` with **scroll-triggered** reveals: fade + translateY (bottom → top), staggered cards as they enter the viewport, while keeping CSS hover polish and LCP-safe hero image.

## Scope

Landing `/` only. Add `motion` dependency. Client wrappers under `components/home/`. No copy/icon changes. No motion on `/jobs` or `/pay`.

## Context

TB-015 used `motion-safe:animate-in` + delays on load — everything animates at once off-screen. Product wants progressive reveal on scroll.

## Change

1. Install `motion`; add `LandingReveal` and `LandingStaggerGrid` (`whileInView`, `once: true`, stagger ~0.12s, `y: 24`).
2. Wire into `landing-view.tsx`; remove first-paint `enterMotion` / `sectionEnterDelay`; keep hover classes.
3. Hero `<img>` + overlay never animated; hero text/CTA may use reveal.
4. Honor `prefers-reduced-motion` via `useReducedMotion` (static markup, no transform).
5. Tests: assert reveal markers / modules; drop first-paint `animate-in` asserts; keep content + hover checks.

## Acceptance

- Cards/sections reveal on scroll (bottom → top), staggered in grids.
- Reduced-motion: no transform animations.
- Hero background image static.
- INDEX status updated.

---

## Definition of Done

- [ ] Change implemented as above
- [ ] Acceptance checks pass
- [ ] `00-INDEX.md` status updated for this ticket

## Out of scope

Parallax hero, Lottie, catalogue/pay motion, marketing copy changes.
