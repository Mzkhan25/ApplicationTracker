# CLAUDE.md — Application Tracker

> Entry point for any AI agent (or human) working on this repository.
> Read this file first, then `docs/STATUS.md` to see where things stand.

## What this project is

A **local-first job application tracker**: a TypeScript + React single-page app
with a Jira-style Kanban board and a dashboard. You record where you applied,
the role, and which pipeline stage each application is in. Data lives in the
browser (`localStorage`) behind a repository interface so a backend can be added
later without touching the UI.

This is an **AI-coded-first** project: it is built and maintained primarily by AI
agents, which is why documentation discipline (below) is a hard rule.

## The documentation rule (MANDATORY)

**Everything must be documented so the next agent can resume without re-deriving
context.** On every change, before you consider a task done:

1. **Update `docs/STATUS.md`** — what is now done, what changed, what's next.
   This is the single source of truth for "where are we".
2. **Add a `docs/CHANGELOG.md` entry** — one bullet per meaningful change, newest
   on top, dated.
3. **If you changed architecture or added a module** → update
   `docs/ARCHITECTURE.md` (file map + data flow).
4. **If you made a non-obvious design choice** → add an entry to
   `docs/DECISIONS.md` (what, why, alternatives rejected).
5. **Keep code comments current** — explain *why*, not *what*. Match the existing
   comment density.

If a change touches behavior, also state how it was verified (command + result).
Do not mark work complete without updating these docs.

## Commands

| Command           | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm install`     | Install dependencies                     |
| `npm run dev`     | Dev server → http://localhost:5173       |
| `npm run build`   | Type-check (`tsc -b`) + production build  |
| `npm run preview` | Preview the production build             |
| `npm test`        | Run Vitest once                          |
| `npm run test:watch` | Vitest in watch mode                  |
| `npm run lint`    | ESLint                                   |

**Definition of done for any task:** `npm run lint`, `npm run build`, and
`npm test` all pass, and the docs above are updated.

## Tech stack

React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS v4 (CSS-first, no JS
config) · Zustand 5 · dnd-kit · React Router 6 · Vitest + React Testing Library.

## Conventions

- **Layering:** UI → Zustand store → pure services → repository interface →
  storage. UI and store never touch `localStorage` directly. See
  `docs/ARCHITECTURE.md`.
- **Pure domain logic** lives in `src/services/` and is unit-tested with no React
  and no mocking. Inject `now: Date` for any time-dependent logic.
- **Persistence** goes through `TrackerRepository` (`src/data/repository.ts`).
  Never read/write `localStorage` outside `localStorageRepository.ts`.
- **State** is one Zustand store (`src/store/useAppStore.ts`); every mutation
  routes through its private `commit()` so persistence happens in exactly one
  place.
- **Stages are user-editable and carry no fixed semantics.** Never hardcode a
  stage name (e.g. "Offer"/"Rejected") in logic — metrics must survive renaming
  and reordering. See `docs/DECISIONS.md`.
- **Tailwind:** custom tokens via the `@theme` block in `src/index.css`
  (e.g. `brand-600`). No `tailwind.config.js`.
- **Accessibility:** form controls are nested inside their `<label>` via the
  `Field` wrapper so they have accessible names. Prefer queryable roles/labels.
- **Tests** live next to the code as `*.test.ts(x)`. Test pure logic in
  isolation; test pages as integration (render + interact + assert store).

## Where to look to resume

1. `docs/STATUS.md` — current state, completed work, known gaps, next steps.
2. `docs/ARCHITECTURE.md` — how it fits together + file map.
3. `docs/DECISIONS.md` — why things are the way they are.
4. `docs/CHANGELOG.md` — history of changes.
