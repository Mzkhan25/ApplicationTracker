# Changelog

Newest first. One bullet per meaningful change. Add an entry whenever you change
behavior, structure, or dependencies (see the documentation rule in `CLAUDE.md`).

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
