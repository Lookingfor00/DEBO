# Job board (DEBO `update-next`)

Public Solinet job board: Next.js App Router at the repo root. This branch is **not** the MERN tenders/Mongo stack on `main`.

Catalogue: upserted `public.items` where `project = jobs`, via AI-scrapper `GET /api/public/jobs` (Bearer `JOBS_READ_KEY`). Visitors log in with Auth0. Favorites and `/pay` (payer number + `balance_xof`) live in schema `jobboard` on the shared instance `ai-scrapper` (S0–S12).

## Docs

- Tickets: [`docs/tickets/00-sprint-tiny-bear/00-INDEX.md`](docs/tickets/00-sprint-tiny-bear/00-INDEX.md)
- SMS Pay (`/pay` + Android ingest): [`../solinet-pay-sms-scrapper/docs/tickets/00-sprint-sms-pay/00-INDEX.md`](../solinet-pay-sms-scrapper/docs/tickets/00-sprint-sms-pay/00-INDEX.md)
- Shared Supabase + Auth0: [`../SOLINET-SHARED-SUPABASE.md`](../SOLINET-SHARED-SUPABASE.md)
- Product SQL (applied on `ai-scrapper`): [`docs/sql/001_jobboard_favorites.sql`](docs/sql/001_jobboard_favorites.sql), [`002_jobboard_payments.sql`](docs/sql/002_jobboard_payments.sql), [`003_orange_money_regex.sql`](docs/sql/003_orange_money_regex.sql), [`004_jobboard_postgrest_schema.sql`](docs/sql/004_jobboard_postgrest_schema.sql), [`005_jobboard_service_role_grants.sql`](docs/sql/005_jobboard_service_role_grants.sql), [`006_jobboard_plans.sql`](docs/sql/006_jobboard_plans.sql)

## Run

```sh
npm install
cp .env.example .env.local
npm run dev
```

Server-only env (never `NEXT_PUBLIC_*` except the public Auth0 client id if you add one later):

| Var | Role |
|-----|------|
| `JOBS_API_URL` | AI-scrapper origin + `/api/public/jobs` |
| `JOBS_READ_KEY` | public catalogue Bearer |
| `APP_BASE_URL` | `http://localhost:3000` |
| `AUTH0_DOMAIN` / `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` / `AUTH0_SECRET` | new Regular Web Application (not the CRA client) |
| `JOBBOARD_SUPABASE_URL` / `JOBBOARD_SECRET_KEY` | dedicated `jobboard` schema key — not scrape `service_role` |

Never set `SUPABASE_SERVICE_ROLE_KEY` or `SCRAPER_RUN_KEY` here. Never put the SMS ingest password (or any ingest secret) in `NEXT_PUBLIC_*`.

## Auth0 dashboard (human)

This app is Next.js App Router. Login is **`@auth0/nextjs-auth0`** (server cookie + `/auth/login` `/auth/callback` `/auth/logout`). Do **not** install `@auth0/auth0-react` or wrap with `Auth0Provider` — that SPA flow cannot feed `sub` into `/api/favorites`.

If the Auth0 Application was created as **SPA** (Token Endpoint Auth Method `none`):

1. Auth0 → Applications → this app (`8yED7cVOViHfYOQHUFmlCIR2e9NA4bMM`).
2. **Application Type** → **Regular Web Application**.
3. **Token Endpoint Authentication Method** → **POST**.
4. Copy **Client Secret** into `AUTH0_CLIENT_SECRET` in `.env.local` (and Vercel).

Then paste these URLs (no trailing slash, no `:443`):

**Allowed Callback URLs**

```
http://localhost:3000/auth/callback
https://jobs.solinet.dev/auth/callback
```

**Allowed Logout URLs**

```
http://localhost:3000
https://jobs.solinet.dev
```

**Allowed Web Origins**

```
http://localhost:3000
https://jobs.solinet.dev
```

**Application Login URI** (optional): `https://jobs.solinet.dev`

Local: `APP_BASE_URL=http://localhost:3000`. Production: `APP_BASE_URL=https://jobs.solinet.dev`. Generate `AUTH0_SECRET` with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Restart `npm run dev` after saving `.env.local`. Click **Connexion**.
