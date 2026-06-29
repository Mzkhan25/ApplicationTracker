# Railway Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Neon + Render + GitHub Pages deployment with an all-Railway deployment (PostgreSQL plugin + Node.js server service + static SPA service).

**Architecture:** Railway hosts three services from the same GitHub repo: a managed PostgreSQL plugin (DB), a Node.js server service (root: `server/`), and a static SPA service (root: `client/`, served with `serve -s`). Railway auto-deploys on push to `main`; GitHub Actions becomes CI-only (lint + test).

**Tech Stack:** Railway (PaaS + managed PostgreSQL), Hono (existing server), Vite (existing client build), `serve ^14` (static file server for the SPA), GitHub Actions (CI only).

## Global Constraints

- Node 20 — matches current environment
- Always `npm ci` in scripts, never `npm install`
- After every code task: `npm run lint:client`, `npm run build:client`, `npm run test:client`, `npm run build:server`, `npm run test:server` must all pass
- No changes to server logic, auth, data routes, or any Zustand store — deployment config only
- Update CHANGELOG.md, STATUS.md, and DECISIONS.md before marking done

---

### Task 1: Prepare client for Railway

Remove GitHub Pages-specific build and routing config; wire in `serve` for SPA hosting.

**Files:**
- Modify: `client/vite.config.ts`
- Modify: `client/index.html`
- Delete: `client/public/404.html`
- Modify: `client/src/main.tsx`
- Modify: `client/package.json`
- Create: `client/railway.toml`

**Interfaces:**
- Produces: A client that builds with `base: '/'`, starts via `npm start` → `serve -s dist`, and handles SPA routing without the GitHub Pages 404 trick.

- [ ] **Step 1: Update `client/vite.config.ts` — remove conditional base**

The current file uses `command === 'build' ? '/ApplicationTracker/' : '/'`. Railway serves at root, so always `'/'`. Also simplify to a static config object (no callback needed):

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 2: Clean `client/index.html` — remove the GitHub Pages SPA decode script**

The `<script>` block at the top of `<head>` decodes paths that `404.html` encoded. Railway's `serve -s` eliminates the need for this trick. Replace `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Application Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Delete `client/public/404.html`**

```bash
rm "client/public/404.html"
```

This file encoded deep-link paths into a query string so GitHub Pages could redirect them. `serve -s` serves `index.html` for all 404s natively — no redirect trick needed.

- [ ] **Step 4: Simplify `client/src/main.tsx` — remove `basename` variable**

The `basename` variable derives from `BASE_URL` (the Vite base path). With `base: '/'` always, `BASE_URL` is always `'/'`, `basename` resolves to `'/'`, and `'/'` is BrowserRouter's default — so the variable is dead. Remove it and remove the `basename` prop:

Replace the current render block:
```tsx
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter
      basename={basename}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

With:
```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

(Keep all existing imports unchanged — only remove the `basename` const and the `basename` prop.)

- [ ] **Step 5: Add `serve` to `client/package.json` and add `start` script**

`serve` is the process that actually runs in Railway's container. Add it to `dependencies` (not devDependencies) so it is present after any potential pruning, and add a `start` script that Railway's `startCommand` will call.

In `client/package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "start": "serve -s dist -l tcp://0.0.0.0:$PORT",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "serve": "^14.2.4",
    "zustand": "^5.0.5"
  }
}
```

Then install to update the lockfile:

```bash
cd client && npm install serve@^14.2.4
```

Expected: `serve` added to `node_modules`, `package-lock.json` updated.

- [ ] **Step 6: Create `client/railway.toml`**

Railway reads this file to override Nixpacks defaults. `$PORT` is injected by Railway at runtime.

```toml
[build]
buildCommand = "npm ci && npm run build"

[deploy]
startCommand = "npm start"
```

- [ ] **Step 7: Run tests**

```bash
npm run test:client
```

Expected: 32 tests pass. (The `basename` removal doesn't affect tests — RTL wraps in its own router.)

- [ ] **Step 8: Run lint + build**

```bash
npm run lint:client && npm run build:client
```

Expected: 0 lint errors; `tsc` + Vite exit 0; `client/dist/` produced with asset paths starting at `/` (not `/ApplicationTracker/`).

- [ ] **Step 9: Verify `dist/index.html` has no GitHub Pages base path**

```bash
grep -c "ApplicationTracker" client/dist/index.html || echo "0 occurrences — correct"
```

Expected: `0 occurrences — correct`

- [ ] **Step 10: Commit**

```bash
git add client/vite.config.ts client/index.html client/src/main.tsx client/package.json client/package-lock.json client/railway.toml
git rm client/public/404.html
git commit -m "feat(client): prepare for Railway — remove GitHub Pages config, add serve"
```

---

### Task 2: Add Railway config for server

**Files:**
- Create: `server/railway.toml`

**Interfaces:**
- Consumes: `server/src/index.ts` which already reads `process.env.PORT ?? '3000'` — no change needed
- Consumes: `server/src/app.ts` which already exposes `GET /health` → `{ ok: true }` — used as healthcheck
- Produces: Railway-deployable server service that auto-starts and is health-checked

- [ ] **Step 1: Create `server/railway.toml`**

```toml
[build]
buildCommand = "npm ci && npm run build"

[deploy]
startCommand = "node dist/index.js"
healthcheckPath = "/health"
healthcheckTimeout = 300
```

- [ ] **Step 2: Run server tests**

```bash
npm run test:server
```

Expected: 4 tests pass (JWT middleware).

- [ ] **Step 3: Run server build**

```bash
npm run build:server
```

Expected: `tsc` exits 0; `server/dist/index.js` present.

- [ ] **Step 4: Commit**

```bash
git add server/railway.toml
git commit -m "feat(server): add railway.toml for Railway deployment"
```

---

### Task 3: Replace GitHub Actions deploy workflow with CI-only workflow

Railway handles deployment natively via GitHub integration. GitHub Actions should run lint + test on every push and PR — nothing more.

**Files:**
- Delete: `.github/workflows/deploy.yml`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: CI that gates merges on passing lint + tests for both packages, without any GitHub Pages permissions or deploy steps.

- [ ] **Step 1: Remove `deploy.yml`**

```bash
git rm .github/workflows/deploy.yml
```

- [ ] **Step 2: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  client:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: client/package-lock.json

      - name: Install
        working-directory: client
        run: npm ci

      - name: Lint
        working-directory: client
        run: npm run lint

      - name: Test
        working-directory: client
        run: npm test

  server:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: server/package-lock.json

      - name: Install
        working-directory: server
        run: npm ci

      - name: Test
        working-directory: server
        run: npm test
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: replace GitHub Pages deploy with CI-only workflow (lint + test for both packages)"
```

---

### Task 4: Provision Railway services (manual — no code changes)

These steps are performed in the Railway dashboard. No commits. Record completion in STATUS.md (Task 5).

- [ ] **Step 1: Create Railway project**
  - Go to https://railway.com → New Project → Deploy from GitHub repo
  - Select the `ApplicationTracker` repo

- [ ] **Step 2: Add PostgreSQL plugin**
  - Inside the project: Add Service → Database → PostgreSQL
  - Railway creates the DB and exposes `DATABASE_URL` — do not copy this manually yet; it will be auto-injected into linked services

- [ ] **Step 3: Deploy the server service**
  - Add Service → GitHub Repo → select `ApplicationTracker` again
  - Set **Root Directory** to `server`
  - Railway picks up `server/railway.toml` automatically
  - In the service settings → Variables: link the PostgreSQL plugin so `DATABASE_URL` is auto-injected
  - Add these env vars manually:
    | Key | Value |
    |---|---|
    | `JWT_SECRET` | Run `openssl rand -hex 32` locally and paste the result |
    | `CLIENT_ORIGIN` | Leave blank for now — fill in after the client deploys |
  - Click Deploy. Wait for green health check on `/health`
  - Copy the server's public domain (e.g. `https://app-tracker-server.up.railway.app`)

- [ ] **Step 4: Push the DB schema to Railway PostgreSQL**
  - In Railway: PostgreSQL plugin → Variables tab → copy `DATABASE_URL`
  - Create `server/.env` locally (do not commit this file — it is gitignored):
    ```
    DATABASE_URL=<railway-postgres-url>
    JWT_SECRET=placeholder
    PORT=3000
    CLIENT_ORIGIN=http://localhost:5173
    ```
  - Run:
    ```bash
    cd server && npm run db:push
    ```
  - Expected: drizzle-kit confirms 4 tables created — `users`, `companies`, `stages`, `applications`

- [ ] **Step 5: Deploy the client service**
  - Add Service → GitHub Repo → select `ApplicationTracker` again
  - Set **Root Directory** to `client`
  - Railway picks up `client/railway.toml` automatically
  - Add env var:
    | Key | Value |
    |---|---|
    | `VITE_API_URL` | The server domain from Step 3 (e.g. `https://app-tracker-server.up.railway.app`) |
  - Click Deploy. Wait for green
  - Copy the client's public domain (e.g. `https://app-tracker-client.up.railway.app`)

- [ ] **Step 6: Wire `CLIENT_ORIGIN` on the server**
  - Go to the server service → Variables
  - Set `CLIENT_ORIGIN` = the client's domain from Step 5
  - Railway redeploys automatically (CORS now allows the client origin)

- [ ] **Step 7: Smoke test**
  1. Open the client URL → Login page appears
  2. Register a new account → Dashboard loads with seeded data
  3. Go to Board → drag a card to another column → reload page → card stays (confirms API + DB round-trip)
  4. Add a column, rename it, move it left/right, delete it → board updates correctly
  5. Click "Sign out" in NavBar → Login page reappears; re-login restores the same data
  6. Open `/board` directly (deep link) → page loads without 404 (confirms `serve -s` SPA routing)

---

### Task 5: Update docs

**Files:**
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/DECISIONS.md`
- Modify: `docs/STATUS.md`
- Modify: `docs/CHANGELOG.md`

- [ ] **Step 1: Replace `docs/DEPLOYMENT.md`**

```markdown
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
```

- [ ] **Step 2: Add D17 to `docs/DECISIONS.md`**

Append at the end of the file:

```markdown
---

## D17 — All-Railway deployment (replaces Neon + Render + GitHub Pages)

**Decision:** Deploy DB, server, and client all on Railway: managed PostgreSQL
plugin (DB), Node.js server service (root: `server/`), static SPA service
(root: `client/`, served by `serve -s`).

**Why:** One platform simplifies networking (Railway services share a private
network), environment variable wiring (`DATABASE_URL` auto-injected from the PG
plugin), billing, and operational surface area. Replaces the original three-platform
plan (Neon + Render + GitHub Pages).

**Client-side changes required:** The GitHub Pages base path (`/ApplicationTracker/`)
is removed — Vite `base` is now always `/`. The `public/404.html` redirect trick
and its paired `index.html` decode script are removed; `serve -s` (single-page-app
mode) serves `index.html` for all unmatched paths natively.

**Alternatives rejected:** Keep Neon + Render + GitHub Pages (three platforms, three
logins, more config surface). Netlify/Vercel for the client only (still two platforms).
Docker on Railway (unnecessary complexity for a small Node.js app + Vite SPA).
```

- [ ] **Step 3: Update `docs/STATUS.md`**

In the Snapshot table, update the GitHub Actions row:

```
| GitHub Actions CI | ✅ ready | ci.yml: lint + test for client + server; Railway handles deploy |
```

Replace the "Next up — deployment" section:

```markdown
## Next up — deployment

See `docs/DEPLOYMENT.md` for the full guide. Summary:

1. **Railway** — Create project, add PostgreSQL plugin, deploy server service
   (root: `server/`), push schema with `db:push`, deploy client service
   (root: `client/`), wire `CLIENT_ORIGIN` and `VITE_API_URL` env vars.
```

- [ ] **Step 4: Add entry to top of `docs/CHANGELOG.md`**

```markdown
## 2026-06-29 — Railway deployment (replaces Neon + Render + GitHub Pages)

- **Client `vite.config.ts`**: Removed conditional `base` (`/ApplicationTracker/`
  on build, `/` on dev); now always `base: '/'` for Railway.
- **Client `index.html`**: Removed the GitHub Pages SPA decode `<script>`.
- **Client `public/404.html`**: Deleted — GitHub Pages path-encoding trick no
  longer needed; `serve -s` handles SPA routing.
- **Client `src/main.tsx`**: Removed `basename` variable (dead with `base: '/'`);
  `BrowserRouter` now uses its default basename of `'/'`.
- **Client `package.json`**: Added `serve ^14` dependency + `start` script
  (`serve -s dist -l tcp://0.0.0.0:$PORT`).
- **`client/railway.toml`**: New file — build: `npm ci && npm run build`, start: `npm start`.
- **`server/railway.toml`**: New file — build: `npm ci && npm run build`, start:
  `node dist/index.js`, healthcheck: `/health`.
- **CI**: `deploy.yml` (GitHub Pages) replaced by `ci.yml` (lint + test for both
  client and server). Railway handles deployment natively.
- **Docs**: `DEPLOYMENT.md` rewritten for Railway; D17 added to `DECISIONS.md`.
```

- [ ] **Step 5: Commit docs**

```bash
git add docs/DEPLOYMENT.md docs/DECISIONS.md docs/STATUS.md docs/CHANGELOG.md
git commit -m "docs: update deployment guide and decisions for Railway"
```

---

## Self-Review

**Spec coverage:**
- ✅ DB on Railway → Task 4 (PostgreSQL plugin)
- ✅ Backend on Railway → Task 2 (`server/railway.toml`) + Task 4 (provisioning)
- ✅ Frontend on Railway → Task 1 (build config + `serve`) + Task 4 (provisioning)
- ✅ SPA routing without GitHub Pages tricks → Task 1 (`serve -s`, remove 404.html)
- ✅ CI still gates merges → Task 3 (`ci.yml`)
- ✅ All docs updated → Task 5
- ✅ Environment variable wiring documented → Task 4 + Task 5

**Placeholder scan:** No TBD, TODO, or "implement later" present. All code steps include the actual content.

**Type consistency:** `serve -s dist -l tcp://0.0.0.0:$PORT` used consistently in package.json and docs. `/health` in `server/railway.toml` matches the route in `server/src/app.ts`. `VITE_API_URL` and `CLIENT_ORIGIN` naming consistent throughout.
