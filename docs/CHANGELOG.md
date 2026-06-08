# Changelog

Newest first. One bullet per meaningful change. Add an entry whenever you change
behavior, structure, or dependencies (see the documentation rule in `CLAUDE.md`).

## 2026-06-08 — Backend implementation complete (Tasks 3–12)

- **DB schema pushed to Neon** — `users`, `companies` (UNIQUE user_id+name), `stages`, `applications` (FK→companies+stages, CASCADE delete). See `docs/DEPLOYMENT.md` for Neon setup.
- **Hono server** — `server/src/app.ts` + `server/src/index.ts`: CORS, JWT middleware on `/api/data/*` and `/api/auth/account`, health endpoint. Hosted on Render (free tier).
- **Auth routes** — POST `/api/auth/register` + `/api/auth/login` (bcrypt cost 10, 30-day JWT). Security: constant-time login (dummy hash for missing users), bcrypt 72-byte limit enforced.
- **Data routes** — GET `/api/data` (load + denormalize companies), PUT `/api/data` (transactional full-replace: upsert companies, delete+insert stages+applications).
- **`ApiRepository`** — `client/src/data/apiRepository.ts` implements `TrackerRepository` via fetch + JWT header. Swap point is `useAppStore.init(token?)`.
- **`useAuthStore`** — Zustand persist store for JWT token + username (`partialize` to localStorage). `login`, `register`, `logout` actions.
- **`LoginPage`** — full-screen form, login ↔ register toggle, error display.
- **Auth wired into app** — `App.tsx` shows `<LoginPage />` when no token; passes token to `init()`; `useAppStore` swaps repo on token change.
- **NavBar** — username display + "Sign out" button added.
- **Deployment guide** — `docs/DEPLOYMENT.md` with Neon + Render + GitHub Pages instructions.
- Design decisions D13–D16 recorded in `docs/DECISIONS.md`.

## 2026-06-07 — Backend scaffolding (Tasks 1–2)

- **Monorepo reorganization** — all frontend source moved to `client/` via
  `git mv`. Root `package.json` replaced with monorepo convenience scripts
  (`dev:client`, `dev:server`, `build:client`, `build:server`, `test:client`,
  `test:server`, `lint:client`, `lint:server`). `.gitignore` updated with
  scoped `client/` and `server/` entries. `deploy.yml` updated: all build
  steps now run with `working-directory: client` and artifact path set to
  `./client/dist`. All 26 client tests still pass.
- **Server package scaffolded** — `server/` directory added with
  `package.json` (Hono 4, `@hono/node-server`, Drizzle ORM 0.44,
  postgres.js, bcryptjs, dotenv), `tsconfig.json` (NodeNext/ESM, strict,
  ES2022), `drizzle.config.ts` (points at `src/db/schema.ts`), and
  `.env.example` (DATABASE_URL, JWT_SECRET, PORT, CLIENT_ORIGIN).
  Dependencies installed (`server/node_modules/`). No source files yet.

## 2026-06-05 — GitHub Pages CI/CD pipeline

- Added `.github/workflows/deploy.yml`: push to `main` runs lint → test → build,
  then uploads `dist/` and deploys to GitHub Pages via the official Actions.
- `vite.config.ts`: production `base` set to `/ApplicationTracker/`; dev stays
  at `/` so local `npm run dev` is unaffected.
- `src/main.tsx`: `BrowserRouter` now reads `basename` from
  `import.meta.env.BASE_URL` so routes resolve under the Pages subpath.
- `index.html`: added SPA decode script — restores deep-link paths that
  `404.html` encoded into a query string before the app boots.
- `public/404.html`: rafrex SPA redirect trick (`pathSegmentsToKeep = 1`);
  included in `dist/` automatically via Vite's `public/` copy.
- One-time manual step: Settings → Pages → Source = **GitHub Actions**.

## 2026-06-05 — Seed demanded salary everywhere + help currency note

- All four seeded sample applications now carry a `demandedSalary` (Globex,
  Initech added; Initech intentionally has one with no posted range, to show the
  badge standing alone).
- HelpPage: added an "all amounts are shown in euros (€)" note to the card-fields
  section (the rest of the page already reflects the donut, per-stage reminders,
  demanded salary, and euros).

## 2026-06-05 — Euros + exact demanded salary

- **Change:** All finances now display in **euros (€)** instead of dollars.
- The **demanded salary** is shown **exactly** (no rounding), e.g. `€185,000`
  (was `$185k`) — via `Intl.NumberFormat('en-IE', EUR)` in `formatMoney`.
- The posted salary **range** stays abbreviated but switched to euros
  (`€120k–150k`). See `DECISIONS.md` D11.
- Updated `formatMoney`/`formatSalary` + their tests, the board test assertions,
  and the in-app HelpPage examples.

## 2026-06-05 — "Demanded salary" application field

- **Feature:** Applications gained an optional `demandedSalary` (the salary you're
  asking for), kept **alongside** the existing posted `salaryMin`/`salaryMax`
  range. Shown prominently on the card as a brand-colored "Asking $130k" badge.
- `Application` + `ApplicationInput` gained `demandedSalary?: number`; new form
  field "Demanded salary (your ask)"; card badge via new `formatMoney` helper;
  two seeded samples carry a value.
- `formatMoney(n)` added to `src/utils/format.ts` (unit-tested), distinct from
  the range `formatSalary`.
- Tests: 23 → 27 (formatMoney + formatSalary regression; board assertions for the
  card badge and form round-trip).

## 2026-06-05 — "How to use" page

- **Feature:** Added an in-app `/help` page ("How to use") documenting every
  feature — the board, adding/editing/moving/deleting applications, card fields,
  customizing columns, follow-up reminders, reading the dashboard, and local
  data storage.
- New `src/pages/HelpPage.tsx` (static content, matches existing design via
  `Panel`); `/help` route in `App.tsx`; "How to use" link in `NavBar`.
- Test: `HelpPage.test.tsx` asserts the title and every section heading render.
- Tests: 22 → 23.

## 2026-06-05 — Pipeline funnel → donut chart

- **Change:** Replaced the funnel-bar "Pipeline funnel" widget with a donut chart
  ("Pipeline breakdown") — total in the center, a slice per stage sized by its
  share of total applications, and a legend (color · name · count · %).
- Rationale: a donut is the natural proportion-of-whole view, and it now
  complements StageCounts (magnitude) instead of duplicating it. Recorded as
  **D10**. "Funnel" was a misnomer (never a true cumulative funnel — D2).
- New pure helper `src/utils/donut.ts` (`donutSegments`) with arc geometry,
  unit-tested (proportional arcs, cumulative offsets, total-zero case).
- Hand-rolled SVG (no chart library); `ConversionFunnel.tsx` removed,
  `PipelineBreakdown.tsx` added; DashboardPage + its test updated.
- Tests: 20 → 22.

## 2026-06-05 — Per-stage follow-up reminders

- **Feature:** Follow-up reminders are now configured **per stage** instead of a
  single global 7-day threshold. Each column has an optional follow-up window;
  an application is flagged once it goes that many days without an update. Stages
  with no window (e.g. terminal Offer/Rejected) never generate reminders.
- `Stage` gained an optional `followUpDays` field (`src/types.ts`).
- `staleApplications(apps, stages, now)` rewritten to use each app's stage window
  (was `(apps, thresholdDays, now)`); pure and unit-tested for per-stage windows
  and the "unset stage never flags" case.
- Seed defaults: Applied 14d, Phone Screen 7d, Interview 5d, Offer/Rejected off.
- Store: new `setStageFollowUpDays(id, days?)` action (persists via `commit()`).
- Board UI: column kebab menu → "Follow-up reminder…" opens an inline editor;
  an amber ⏰ badge in the column header shows the active window.
- Dashboard: passes `stages` to `staleApplications`; "Follow-ups due" hint now
  reads "past stage reminder window."
- Decision recorded as **D9** in `DECISIONS.md` (a stage now carries behavior).
- Tests: 16 → 20 (added per-stage follow-up cases + store action coverage).

## 2026-06-04 — Initial implementation

- **Docs:** Added `CLAUDE.md` (agent entry point + documentation rule) and
  `docs/` (`ARCHITECTURE.md`, `DECISIONS.md`, `STATUS.md`, `CHANGELOG.md`).
- **Polish:** Custom SVG favicon; React Router v7 future flags; Vite `.gitignore`
  block; `README.md`.
- **Dashboard:** Stat tiles (applications, response rate, companies, follow-ups
  due), applications-by-stage bars, pipeline funnel, recent activity, and
  follow-up reminders with a "Done" action to reset staleness.
- **Board:** dnd-kit Kanban — sortable cards with a grip handle, droppable
  columns, add/edit application modal (full field set, accessible `Field`
  wrapper), and column add/rename/move-left-right/delete.
- **App shell:** `AppShell` + `NavBar`, routes `/` (Dashboard) and `/board`;
  reusable `Button`, `Badge`, `PriorityTag`, `Modal`.
- **Store + services:** Zustand store with centralized `commit()` persistence;
  pure, unit-tested `ordering`, `metrics`, `followups`, `activity` services.
- **Data layer:** `TrackerRepository` interface + `LocalStorageRepository`
  (seeds 5 default stages + 4 sample applications, one intentionally stale);
  domain `types.ts`.
- **Scaffold:** Vite + React 18 + TypeScript (strict), Tailwind CSS v4
  (CSS-first via `@tailwindcss/vite` + `@theme`), ESLint, Vitest + React Testing
  Library.
- **Tests:** 16 passing across data layer, services, and page integration.
