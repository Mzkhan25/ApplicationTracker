# Deployment Guide

All three services (database, backend, frontend) are hosted on [Railway](https://railway.com).

## Prerequisites

- A Railway account (free tier)
- Repo pushed to GitHub

---

## 1. Create Railway project

Go to https://railway.com → New Project → Deploy from GitHub repo → select
the `ApplicationTracker` repository.

---

## 2. PostgreSQL (database)

1. Add Service → Database → PostgreSQL.
2. Railway auto-injects `DATABASE_URL` into any service that links this plugin.
3. Push the schema locally — copy the connection string from the plugin's
   Variables tab, create `server/.env`:
   ```
   DATABASE_URL=<railway-postgres-url>
   JWT_SECRET=placeholder
   ```
   Then run:
   ```bash
   cd server && npm run db:push
   ```
   Expected: drizzle-kit confirms 4 tables (`users`, `companies`, `stages`,
   `applications`).

---

## 3. Server (Hono API)

1. Add Service → GitHub Repo → select `ApplicationTracker`
2. Set **Root Directory** to `server`
3. Link the PostgreSQL plugin so `DATABASE_URL` is auto-injected
4. Add environment variables:
   | Key | Value |
   |---|---|
   | `JWT_SECRET` | `openssl rand -hex 32` |
   | `CLIENT_ORIGIN` | Client Railway domain — set after client deploys |
5. Deploy. Verify green on `/health`. Copy the server domain.

---

## 4. Client (React SPA)

1. Add Service → GitHub Repo → select `ApplicationTracker`
2. Set **Root Directory** to `client`
3. Add environment variable:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | Server domain from step 3 |
4. Deploy. Copy the client domain.
5. Return to the server service → set `CLIENT_ORIGIN` = client domain → Railway
   redeploys.

---

## 5. Notes

- Railway auto-deploys both services on every push to `main`.
- `VITE_API_URL` is a **build-time** Vite variable embedded into the bundle
  during Railway's build step. Changing it requires a client redeploy.
- To update the DB schema: edit `server/src/db/schema.ts`, run `npm run db:push`
  (use `db:generate` + `db:migrate` for production-safe zero-downtime migrations).
- The server exposes `GET /health → { ok: true }`, used by Railway's health check
  (configured in `server/railway.toml`).
