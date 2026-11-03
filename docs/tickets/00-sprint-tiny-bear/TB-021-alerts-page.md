# TB-021 — `/alerts` page (activate + keywords + matched jobs)

| Field | Value |
|-------|--------|
| **Status** | `todo` |
| **Depends on** | TB-019, TB-003 |
| **S refs** | S1, S6, S12 |
| **Suggested PR title** | `feat(jobboard): alerts page with phone activation and keywords` |
| **Repo** | DEBO (`update-next`) |

---

## Goal

Browser page `/alerts`: gate with phone + activation code (session cookie), save keyword filters, show list of matching upserted jobs (computed server-side via existing jobs read path).

## Scope

`app/alerts` + views/hooks following architecture layers. No Web Push / WhatsApp.

## Context

Freeze [`context.md`](./context.md). Matching = **keywords only**. Catalogue via server `JOBS_READ_KEY` / existing list loader — client must not pass scraper `project`.

## Change

1. Route `/alerts`: if no valid alerts session → activate form (msisdn + code) → TB-019 activate.
2. Logged-in alerts session: edit/save keyword filters (TB-017 storage via API).
3. List: jobs matching keywords (title/description fields as available); empty and error states + retry.
4. Chrome: link from header/nav if trivial; caramel UI consistent with TB-009/010.
5. Tests: gate without session; with session shows filters + list fixtures; no `listJobs` project from client.

## Acceptance

- Unactivated user cannot see filtered catalogue.
- Activated user sees keyword UI and matched jobs.
- No push subscription code in this PR.

---

## Definition of Done

- [ ] Change implemented as above
- [ ] Acceptance checks pass
- [ ] `00-INDEX.md` status updated for this ticket

## Out of scope

Native app, Web Push, WhatsApp, OTP, APK, invoice gate, admin code list UI.
