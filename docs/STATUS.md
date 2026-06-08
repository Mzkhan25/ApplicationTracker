# Project Status & Handoff

**Single source of truth for "where are we." Update this on every change.**

_Last updated: 2026-06-08_

## Snapshot

Backend implementation **complete** (all 12 tasks done). The repo is a monorepo
(`client/` + `server/`). The full auth + data API is implemented (Hono + Drizzle
+ Neon). The client has `ApiRepository`, `useAuthStore`, `LoginPage`, and the
logout button wired in. All quality gates pass on both packages.

| Gate                        | Status | Notes                                              |
| --------------------------- | ------ | -------------------------------------------------- |
| `npm run lint:client`       | ✅ pass | 0 problems                                         |
| `npm run build:client`      | ✅ pass | tsc strict + Vite, assets at `/ApplicationTracker/` |
| `npm run test:client`       | ✅ pass | 32 tests, 10 files                                 |
| `npm run dev:client`        | ✅ runs | `/`, `/board`, `/favicon.svg` → HTTP 200           |
| GitHub Actions              | ✅ ready | deploy.yml updated for `client/` working directory |
| `npm run test:server`       | ✅ pass | 4 tests (JWT middleware)                           |
| `npm run build:server`      | ✅ pass | tsc NodeNext/ESM, emits to `server/dist/`          |

## Completed

- [x] **Scaffold** — Vite + React 18 + TS, Tailwind v4 (CSS-first), ESLint,
      Vitest + RTL. Manual `package.json`/config (not `npm create`).
- [x] **Data layer** — `types.ts`, `TrackerRepository` interface,
      `LocalStorageRepository` (seeds on first load), `seed.ts`.
- [x] **Store + services** — Zustand store with centralized persistence; pure
      `ordering`, `metrics`, `followups`, `activity` services.
- [x] **App shell + routing** — `AppShell`, `NavBar`, routes `/` and `/board`;
      common primitives (`Button`, `Badge`, `PriorityTag`, `Modal`).
- [x] **Kanban board** — sortable cards (dnd-kit), droppable columns, add/edit
      modal with full field set, column add/rename/move/delete.
- [x] **Dashboard** — stat tiles, applications-by-stage, pipeline funnel, recent
      activity, follow-up reminders (with "Done" to reset staleness).
- [x] **Polish** — favicon, Router v7 future flags, `.gitignore` Vite block,
      README, this documentation set.
- [x] **Per-stage follow-up reminders** (2026-06-05) — `Stage.followUpDays`;
      `staleApplications` uses each app's stage window; seeded defaults
      (14/7/5/off/off); `setStageFollowUpDays` action; column kebab editor +
      header ⏰ badge. See `DECISIONS.md` D9.
- [x] **Pipeline donut** (2026-06-05) — replaced the funnel-bar widget with a
      hand-rolled SVG donut (`PipelineBreakdown`) backed by the pure
      `donutSegments` helper; complements StageCounts. See `DECISIONS.md` D10.
- [x] **"How to use" page** (2026-06-05) — in-app `/help` page documenting every
      feature; "How to use" nav link. `src/pages/HelpPage.tsx`.
- [x] **Demanded salary field** (2026-06-05) — optional `Application.demandedSalary`
      alongside the posted range; "Asking €185,000" badge on the card. All four
      seeded samples carry one; HelpPage documents it.
- [x] **Euros + exact demanded salary** (2026-06-05) — all finances in € (was $);
      demanded salary shown exactly (no rounding); range stays abbreviated
      (`€120k–150k`). See `DECISIONS.md` D11.
- [x] **GitHub Pages CI/CD** (2026-06-05) — `.github/workflows/deploy.yml`
      (lint → test → build → deploy-pages on push to `main`); Vite `base` path;
      BrowserRouter `basename`; `public/404.html` SPA redirect; `index.html`
      decode script. See `DECISIONS.md` D12. Live at
      `https://mzkhan25.github.io/ApplicationTracker/` once Pages is enabled.
- [x] **Monorepo reorganization** (2026-06-07) — all frontend files moved to
      `client/`; root `package.json` replaced with convenience scripts
      (`dev:client`, `build:client`, etc.); `deploy.yml` updated to run from
      `client/` working directory. See plan Task 1.
- [x] **Server package scaffolded** (2026-06-07) — `server/` directory created
      with `package.json` (Hono, Drizzle, postgres.js, bcryptjs), `tsconfig.json`
      (NodeNext/ESM, strict), `drizzle.config.ts`, `.env.example`. No source
      files yet. See plan Task 2.
- [x] **DB schema** (2026-06-08) — `server/src/db/schema.ts` defines `users`,
      `companies` (UNIQUE user_id+name), `stages`, `applications` (FK→companies+
      stages, CASCADE delete); `server/src/db/index.ts` wires postgres.js +
      Drizzle; schema pushed to Neon via `db:push`.
- [x] **Server domain types** (2026-06-08) — `server/src/types.ts` mirrors
      client `Stage`, `Application`, `TrackerData` shapes for route handlers.
- [x] **Auth routes** (2026-06-08) — `server/src/routes/auth.ts`: POST
      `/api/auth/register` + `/api/auth/login` (bcrypt cost 10, 30-day JWT),
      DELETE `/api/auth/account`. Constant-time login guards against user
      enumeration; bcrypt 72-byte limit enforced.
- [x] **Data routes** (2026-06-08) — `server/src/routes/data.ts`: GET
      `/api/data` (load + denormalize companies); PUT `/api/data` (transactional
      full-replace: upsert companies, delete+insert stages+applications).
- [x] **Hono app + server entry + tests** (2026-06-08) — `server/src/app.ts`
      (CORS, JWT middleware, route wiring, `/health`), `server/src/index.ts`
      (starts `@hono/node-server`); JWT middleware unit tests (4 tests pass).
- [x] **`ApiRepository`** (2026-06-08) — `client/src/data/apiRepository.ts`
      implements `TrackerRepository` via fetch + `Authorization: Bearer` header.
      `useAppStore.init(token?)` swaps to `ApiRepository` when a token is given.
- [x] **`useAuthStore` + `LoginPage`** (2026-06-08) — Zustand persist store
      for JWT token + username (`partialize` to localStorage); `login`,
      `register`, `logout` actions. `LoginPage.tsx`: full-screen form, login ↔
      register toggle, error display.
- [x] **Auth wired into app** (2026-06-08) — `App.tsx` shows `<LoginPage />`
      when no token; passes token to `useAppStore.init()`; store swaps repo on
      token change. `client/.env.example` added (`VITE_API_URL`).
- [x] **Logout button + username display** (2026-06-08) — `NavBar` shows
      authenticated username and a "Sign out" button that calls
      `useAuthStore.logout()`.
- [x] **Documentation complete** (2026-06-08) — `docs/DEPLOYMENT.md` added;
      `ARCHITECTURE.md`, `STATUS.md`, `CHANGELOG.md`, `DECISIONS.md` updated
      to reflect completed backend (D13–D16).

## Test inventory (32 client tests + 4 server tests)

### Client (`client/src/`)

- `data/localStorageRepository.test.ts` — first-run seeding; save/load
  round-trip.
- `services/services.test.ts` — `moveCard` (cross/intra-column, unknown id),
  `reorderStages`, `stageCounts`, `pipelineSummary` (incl. empty), `followups`
  (`daysSince`; per-stage windows; unset stage never flags; ordering),
  `recentApplications`.
- `store/useAppStore.test.ts` — `setStageFollowUpDays` sets and clears a
  stage's follow-up window.
- `utils/donut.test.ts` — `donutSegments` proportional arcs, cumulative
  offsets, and the total-zero case.
- `pages/HelpPage.test.tsx` — the page title and every section heading render.
- `utils/format.test.ts` — `formatMoney` (exact thousands, rounding) +
  `formatSalary` range regression.
- `pages/BoardPage.test.tsx` — renders default columns + seeded cards; add an
  application through the modal persists to the store.
- `pages/DashboardPage.test.tsx` — all four widgets render; the stale seeded
  app (Globex, Phone Screen 7d window, idle 12d) surfaces as a follow-up.
- `store/useAuthStore.test.ts` — login/register/logout actions; token and
  username persisted correctly.
- `pages/LoginPage.test.tsx` — form renders; login ↔ register toggle; error
  display; calls useAuthStore actions.

### Server (`server/src/`)

- `middleware/auth.test.ts` — JWT middleware: missing header → 401; invalid
  token → 401; valid token → payload attached; expired token → 401.

## Known limitations / gaps

- **Drag-and-drop is not covered by automated tests** (jsdom can't simulate
  pointer drag). The underlying `moveCard` logic *is* unit-tested. Verify drag
  manually (see below) or add Playwright/E2E if desired.
- **No win/loss conversion metric** — intentional; stages are semantic-free
  (see `DECISIONS.md` D2). Would require adding a stage category.
- **Single board only** — no multiple boards/pipelines.
- **No data import/export** — data is per-browser; clearing site data wipes it.
- The pre-existing root `.gitignore` is the Visual Studio template; a Vite block
  was appended rather than replacing it.

## Deferred / explicitly out of scope (from the approved plan)

- Swimlanes, multiple boards, attachments, import/export.

## Backend implementation — completed tasks

Implementation plan: `docs/superpowers/plans/2026-06-07-backend-implementation.md`
Spec: `docs/superpowers/specs/2026-06-07-backend-design.md`

| Task | Description | Status |
|------|-------------|--------|
| 1 | Monorepo reorganization (move frontend → `client/`) | ✅ Done |
| 2 | Scaffold `server/` package | ✅ Done |
| 3 | DB schema (`server/src/db/schema.ts`) + Drizzle connection + `db:push` to Neon | ✅ Done |
| 4 | Server domain types (`server/src/types.ts`) | ✅ Done |
| 5 | Auth routes — POST /api/auth/register + /api/auth/login | ✅ Done |
| 6 | Data routes — GET + PUT /api/data (with transaction) | ✅ Done |
| 7 | Hono app.ts + index.ts, CORS, JWT middleware, health, middleware tests | ✅ Done |
| 8 | Client `ApiRepository` + tests | ✅ Done |
| 9 | Client `useAuthStore` (Zustand persist) + `LoginPage` + tests | ✅ Done |
| 10 | Wire `activeRepo` into `useAppStore`, update `App.tsx`, add `client/.env.example` | ✅ Done |
| 11 | Logout button + username display in `NavBar` | ✅ Done |
| 12 | Update all docs (STATUS, CHANGELOG, ARCHITECTURE, DECISIONS D13–D16, DEPLOYMENT.md) | ✅ Done |

## Next up — deployment

See `docs/DEPLOYMENT.md` for the full guide. Summary:

1. **Neon** — create project, copy connection string, run `cd server && npm run db:push`.
2. **Render** — connect repo, set root directory to `server`, add env vars
   (`DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`).
3. **GitHub Pages** — add `VITE_API_URL` repo secret, enable Pages (Settings →
   Pages → Source = GitHub Actions), push to `main`.

## Other suggested next steps (post-deployment)

1. Optional: add E2E coverage (Playwright) for the drag-to-move-and-persist flow.
2. Optional: stage `category` + true conversion funnel (revisits D2) if the user
   wants win/loss analytics.
3. Optional: data export/import (JSON) for backup/portability.

## Manual verification (the one thing tests don't cover)

```bash
# Client only (falls back to localStorage — no server needed)
npm run dev:client

# Full stack (requires server/.env with DATABASE_URL + JWT_SECRET)
npm run dev:server   # terminal 1
npm run dev:client   # terminal 2
```

1. Open http://localhost:5173 → Login page appears (if server running) or
   Dashboard/Board in localStorage mode (if no server).
2. Register a new account → redirected to Dashboard with seeded data.
3. Go to **Board** → drag a card to another column → reload the page → the card
   stays in the new column (API round-trip).
4. Add a column, rename it via the kebab menu, move it left/right, delete it →
   cards in a deleted column move to the first remaining column.
5. Column kebab → "Follow-up reminder…" → set a small day count → the ⏰ badge
   appears in the header; a card idle past that window shows under "Follow-up
   reminders" on the dashboard. Clear the field to turn reminders off.
6. Click a card → edit fields / delete → changes reflect on the board and
   dashboard.
7. Click "Sign out" in the NavBar → login page reappears; re-login restores data.

## Environment

Node 20.19.5, npm 10.8.2. Server requires `DATABASE_URL` and `JWT_SECRET` in
`server/.env`. Client requires `VITE_API_URL` in `client/.env` (or falls back
to localStorage mode if unset).

## Outstanding advisory

`npm audit` reports 1 critical advisory in the **Vitest UI server**
(`vitest --ui`), a dev-only tool this project never runs; the fix is a major
Vitest v4 upgrade. Left as-is; revisit if adopting Vitest 4.
