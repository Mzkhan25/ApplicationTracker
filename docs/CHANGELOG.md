# Changelog

Newest first. One bullet per meaningful change. Add an entry whenever you change
behavior, structure, or dependencies (see the documentation rule in `CLAUDE.md`).

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
