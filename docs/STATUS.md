# Project Status & Handoff

**Single source of truth for "where are we." Update this on every change.**

_Last updated: 2026-06-05_

## Snapshot

The initial implementation is **complete and green**, plus per-stage follow-up
reminders (2026-06-05). A local-first job application tracker with an editable
Kanban board and a dashboard is fully functional. All quality gates pass.

| Gate            | Status | Notes                                        |
| --------------- | ------ | -------------------------------------------- |
| `npm run lint`  | ✅ pass | 0 problems                                   |
| `npm run build` | ✅ pass | tsc strict + Vite, assets at `/ApplicationTracker/` |
| `npm test`      | ✅ pass | 26 tests, 8 files                            |
| `npm run dev`   | ✅ runs | `/`, `/board`, `/favicon.svg` → HTTP 200     |
| GitHub Actions  | ✅ ready | `.github/workflows/deploy.yml` created       |

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

## Test inventory (16 tests)

- `src/data/localStorageRepository.test.ts` — first-run seeding; save/load
  round-trip.
- `src/services/services.test.ts` — `moveCard` (cross/intra-column, unknown id),
  `reorderStages`, `stageCounts`, `pipelineSummary` (incl. empty), `followups`
  (`daysSince`; per-stage windows; unset stage never flags; ordering),
  `recentApplications`.
- `src/store/useAppStore.test.ts` — `setStageFollowUpDays` sets and clears a
  stage's follow-up window.
- `src/utils/donut.test.ts` — `donutSegments` proportional arcs, cumulative
  offsets, and the total-zero case.
- `src/pages/HelpPage.test.tsx` — the page title and every section heading
  render.
- `src/utils/format.test.ts` — `formatMoney` (exact thousands, rounding) +
  `formatSalary` range regression.
- `src/pages/BoardPage.test.tsx` — renders default columns + seeded cards; add an
  application through the modal persists to the store.
- `src/pages/DashboardPage.test.tsx` — all four widgets render; the stale seeded
  app (Globex, Phone Screen 7d window, idle 12d) surfaces as a follow-up.

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

- Real backend + auth (the `TrackerRepository` seam is ready for it).
- Swimlanes, multiple boards, attachments, import/export.

## Suggested next steps (pick up here)

1. **Enable GitHub Pages** (one-time manual step): repo Settings → Pages →
   Source = **GitHub Actions**. Then push to `main` — the workflow deploys
   automatically. URL: `https://mzkhan25.github.io/ApplicationTracker/`
2. Optional: add E2E coverage (Playwright) for the drag-to-move-and-persist flow.
3. Optional: stage `category` + true conversion funnel (revisits D2) if the user
   wants win/loss analytics.
4. Optional: data export/import (JSON) for backup/portability.

## Manual verification (the one thing tests don't cover)

```bash
npm run dev
```

1. Open http://localhost:5173 → Dashboard shows seeded stats and a follow-up for
   "Globex".
2. Go to **Board** → drag a card to another column → reload the page → the card
   stays in the new column (localStorage round-trip).
3. Add a column, rename it via the kebab menu, move it left/right, delete it →
   cards in a deleted column move to the first remaining column.
4. Column kebab → "Follow-up reminder…" → set a small day count → the ⏰ badge
   appears in the header; a card idle past that window shows under "Follow-up
   reminders" on the dashboard. Clear the field to turn reminders off.
5. Click a card → edit fields / delete → changes reflect on the board and
   dashboard.

## Environment

Node 20.19.5, npm 10.8.2. No backend, no env vars required.

## Outstanding advisory

`npm audit` reports 1 critical advisory in the **Vitest UI server**
(`vitest --ui`), a dev-only tool this project never runs; the fix is a major
Vitest v4 upgrade. Left as-is; revisit if adopting Vitest 4.
