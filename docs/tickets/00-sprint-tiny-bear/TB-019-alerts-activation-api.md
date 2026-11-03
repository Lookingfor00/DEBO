# TB-019 — Alerts activation APIs

| Field | Value |
|-------|--------|
| **Status** | `done` |
| **Depends on** | TB-017 |
| **S refs** | S0, S4, S5 |
| **Suggested PR title** | `feat(jobboard): alerts activate request-code invalidate APIs` |
| **Repo** | DEBO (`update-next`) |

---

## Goal

Server APIs so a phone can request an activation code (server creates it), activate with phone+code (httpOnly session cookie), and invalidate a code (for APK / ops) without Auth0 on the alerts surface.

## Scope

Route Handlers (+ thin `lib/api`) only. No full `/alerts` page (TB-021). No APK UI (PI-013).

## Context

Freeze [`context.md`](./context.md). Code generation is **never** in the browser. Invalidate = mark code invalid so that phone binding stops receiving updates / session is rejected.

## Change

1. **`POST` request-code** (Auth0 session for purchaser / pay flow as needed): server checks eligibility (e.g. paid plan / server rules — not invoice gate), creates **one** code row, returns plaintext **once**. Idempotent rules: never mint a second code for the same purchase entitlement.
2. **`POST` activate**: body `msisdn` + `code` → validate → bind phone → set **httpOnly** secure session cookie identifying the activation.
3. **`POST` invalidate** (authenticated for payment-ingest or server secret suitable for APK — document; no `service_role` in APK): body includes code string → status invalidated; subsequent activate/session for that code fails.
4. Middleware or helper: read alerts session cookie for later TB-021.
5. Tests: happy paths + reuse code fails + invalidate blocks; no code creation in client bundles.

## Acceptance

- Front cannot invent codes; only server responses return a new code.
- Activate sets httpOnly cookie; invalidate clears access for that code.
- PI-013 can call invalidate without listing codes.

---

## Definition of Done

- [x] Change implemented as above
- [x] Acceptance checks pass
- [x] `00-INDEX.md` status updated for this ticket

## Out of scope

`/alerts` UI, keyword filter CRUD UI, invoice gate, Web Push, OTP, native app.
