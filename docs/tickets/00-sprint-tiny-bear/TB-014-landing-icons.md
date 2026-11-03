# TB-014 — Landing icons

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-013 |
| **S refs** | S12 |
| **Suggested PR title** | `feat(jobboard): landing lucide icons` |
| **Repo** | DEBO (`next`) |

---

## Goal

Add as many **meaningful** Lucide icons as practical across the landing (and reuse patterns on related chrome if trivial) so each card, step, and CTA reads at a glance. Prefer density with a role per icon — not decoration for its own sake.

## Scope

Iconography only on `/` marketing sections after TB-013 structure exists. Keep `lucide-react` (already in DEBO). Keep the custom WhatsApp SVG for green CTAs. No new icon font packages.

## Context

Landing after TB-013: hero, comment rejoindre, problème, solution, équipe, garantie, plan, contact. Existing WhatsApp icon in [`landing-view.tsx`](../../../components/home/landing-view.tsx). Caramel theme TB-009 (`text-primary`, etc.).

## Change

1. Inventory slots and assign Lucide icons (adjust names if a better Lucide glyph fits):
   - **Problème:** e.g. `GraduationCap`, `Smartphone` / scroll-idle, `Users` (tonton / réseau).
   - **Solution:** e.g. `Filter`, `MessageCircle`, `Network` / `Handshake`.
   - **Comment rejoindre steps:** distinct step icons (explore, premium, personalized).
   - **Qui nous sommes:** `UserRound` / role-appropriate icons next to bios.
   - **Garantie:** keep or reinforce `Check` / `ShieldCheck`.
   - **Plan / pay CTAs:** `Wallet` / `BadgeCheck` as fits.
   - **Contact:** `Mail` on the form heading.
   - **Hero:** optional small icons on secondary CTAs only if they stay readable on overlay.
2. Wire icons in views with consistent size (`size-4` / `size-5`) and `aria-hidden` when decorative; label nearby text remains the accessible name.
3. Do not add Font Awesome or emoji as substitutes.
4. Vitest: assert documented slots render an `<svg>` (or `data-icon`) for each listed section title / card.

## Acceptance

- Every TB-013 section that has list cards or steps shows an icon on each item.
- WhatsApp channel CTA still uses the green WhatsApp mark.
- No new npm icon dependency.
- Landing copy and routes unchanged except icon markup.

---

## Definition of Done

- [ ] Change implemented as above
- [ ] Acceptance checks pass
- [ ] `00-INDEX.md` status updated for this ticket

## Out of scope

Animations (TB-015). New marketing copy. Icons on `/jobs` or `/pay` unless a one-line reuse is free. Lottie / custom illustration packs.
