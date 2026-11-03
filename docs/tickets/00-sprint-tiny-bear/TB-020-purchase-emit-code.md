# TB-020 — Purchase flow: request activation code once

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-019, PI-009, PI-010 |
| **S refs** | S5, S8 |
| **Suggested PR title** | `feat(jobboard): show one-shot activation code after purchase` |
| **Repo** | DEBO (`update-next`) |

---

## Goal

After a successful plan purchase on `/pay`, the client **asks the server** for the activation code once and shows a clear “save this code” message. The server never regenerates a second code for that entitlement.

## Scope

Wire purchase success UX + call to request-code API (TB-019). Invoice gate (TB-018) does **not** apply here.

## Context

Freeze [`context.md`](./context.md) rows 7, 12. Auth0 remains for `/pay` / wallet; alerts surface stays phone+code later.

## Change

1. On successful `purchase_plan` (or equivalent), call server **request-code**; display code once with strong copy to save it.
2. If code already emitted for that entitlement, show a safe message (no second mint) — exact copy in impl.
3. Tests: purchase success triggers one request-code; second call does not create another available code.

## Acceptance

- User who just subscribed can see exactly one server-issued code.
- Browser never locally generates the code string.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

`/alerts` page, APK invalidate UI, invoice reference for recharges, WhatsApp delivery of the code.
