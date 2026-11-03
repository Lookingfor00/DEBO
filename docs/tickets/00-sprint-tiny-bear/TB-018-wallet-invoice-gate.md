# TB-018 — Wallet invoice / SMS reference gate

| Field | Value |
|-------|--------|
| **Status** | `todo` |
| **Depends on** | PI-006, PI-001 |
| **S refs** | S0, S4, S5, S10 |
| **Suggested PR title** | `feat(jobboard): wallet credit requires SMS invoice reference` |
| **Repo** | DEBO (`update-next`) SQL + API |

---

## Goal

Stop trusting a bare MSISDN for wallet top-up confirmation: credit (or expose balance after credit path) only when the user supplies the **SMS-parsed invoice/reference** number; front may only **GET** balance (with last reference); backend balance is authoritative.

## Scope

SQL + wallet Route Handler / RPC changes for **Auth0-linked wallet recharges** only. Not subscription purchase / activation-code emit (TB-020).

## Context

Freeze [`context.md`](./context.md) rows 10–12. Ingest already parses a `reference` from SMS into payment events — user must **re-enter** that reference. Last reference may live in **localStorage** for subsequent GET balance calls. Mismatch front vs back → use backend only.

## Change

1. Persist / require last confirmed invoice reference per wallet (or per credit event) as needed for “before first balance” and “before each credit update”.
2. Credit path: do not increase balance unless reference matches an eligible unmatched/matched payment event for that wallet’s payer MSISDN (exact match rules documented in ticket impl notes).
3. Balance API: **GET only** (query param or header for last invoice ref if required); **no POST** that sets balance from the client.
4. `/pay` UX: prompt for invoice number where needed; store last value in localStorage for refresh GET.
5. Tests: credit rejected without/wrong reference; GET returns server balance; no client POST balance setter.

## Acceptance

- Recharge without valid SMS reference does not credit.
- GET balance never trusts a client-supplied balance amount.
- Subscription purchase path unchanged by this gate.

---

## Definition of Done

- [ ] Change implemented as above
- [ ] Acceptance checks pass
- [ ] `00-INDEX.md` status updated for this ticket

## Out of scope

OTP, alerts activation APIs (TB-019), APK parse toggle, emitting activation codes, Web Push.
