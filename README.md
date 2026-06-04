# Application Tracker

A local-first job application tracker with a Jira-style Kanban board and a
dashboard. Track where you applied, the role, and where each application sits in
your pipeline. Built as a TypeScript + React single-page app styled with
Tailwind CSS.

## Features

- **Kanban board** — one card per application, organized into status columns.
  Drag cards between columns to update status.
- **Editable pipeline** — add, rename, reorder (move left/right), and delete
  columns. Defaults: Applied → Phone Screen → Interview → Offer → Rejected.
- **Rich application cards** — company, role, status, applied date, job URL,
  priority, location, work mode, salary range, and notes.
- **Dashboard** — applications-by-stage, a pipeline funnel, recent activity, and
  follow-up reminders driven by a per-stage window (each column can flag cards
  that sit idle too long; terminal columns can be left off).
- **Local-first** — all data is stored in your browser via `localStorage`. No
  account, no server. The data layer sits behind a `TrackerRepository`
  interface so a backend can be added later without touching the UI.
- **In-app "How to use" page** — `/help` documents every feature for end users.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

## Scripts

| Command          | Description                              |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | Start the Vite dev server                |
| `npm run build`  | Type-check and build for production       |
| `npm run preview`| Preview the production build             |
| `npm test`       | Run the unit/component tests (Vitest)    |
| `npm run lint`   | Lint the codebase (ESLint)               |

## Architecture

```
UI (pages, components)      React + Tailwind, dnd-kit drag-and-drop
        │
State store (Zustand)       src/store/useAppStore.ts
        │
Domain services (pure)      src/services/  funnel, follow-ups, ordering
        │
Repository interface        src/data/repository.ts
        │
LocalStorageRepository      src/data/localStorageRepository.ts  ← swap point
```

The repository boundary is the key seam: the store and UI never know whether
data comes from `localStorage` or a future API. Domain logic lives in pure,
unit-tested functions in `src/services/`.

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS v4 · Zustand · dnd-kit ·
React Router · Vitest + React Testing Library.

## Documentation

This is an AI-coded-first project with a documentation rule: everything is kept
documented so work can be resumed without re-deriving context.

- [`CLAUDE.md`](./CLAUDE.md) — entry point for AI agents; conventions + the
  documentation rule.
- [`docs/STATUS.md`](./docs/STATUS.md) — current state, what's done, what's next.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — layers, data flow, file map.
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — why things are the way they are.
- [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) — history of changes.
