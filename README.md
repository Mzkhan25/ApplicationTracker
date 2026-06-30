# Application Tracker

A multi-user job application tracker with a Jira-style Kanban board and a
dashboard. Track where you applied, the role, and where each application sits in
your pipeline. Built as a TypeScript + React SPA (Vite + Tailwind) backed by a
Hono + Drizzle + Neon API with JWT authentication.

## Features

- **Kanban board** — one card per application, organized into status columns.
  Drag cards between columns to update status.
- **Editable pipeline** — add, rename, reorder (move left/right), and delete
  columns. Defaults: Applied → Phone Screen → Interview → Offer → Rejected.
- **Rich application cards** — company, role, status, applied date, job URL,
  priority, location, work mode, salary range, demanded salary, and notes.
- **Dashboard** — applications-by-stage, a pipeline breakdown donut, recent
  activity, and follow-up reminders driven by a per-stage window.
- **Auth** — register/login with JWT; each user's data is isolated. "Sign out"
  in the NavBar. Account deletion (DELETE /api/auth/account) cascades all data.
- **In-app "How to use" page** — `/help` documents every feature.

## Live demo

Deployed to Railway: **https://delightful-education-production-7387.up.railway.app/**

## Monorepo layout

```
/
├── client/          React SPA (Vite + Tailwind + Zustand + dnd-kit)
├── server/          Hono API (Drizzle ORM, Neon/PostgreSQL, bcryptjs)
├── docs/            Architecture, decisions, changelog, status, deployment
└── package.json     Root convenience scripts (dev:client, dev:server, …)
```

## Getting started

### Client only (falls back to localStorage — no server needed)

```bash
npm install
npm run dev:client   # http://localhost:5173
```

### Full stack

```bash
# 1. Server setup
cp server/.env.example server/.env
# Edit server/.env — set DATABASE_URL (Neon), JWT_SECRET, CLIENT_ORIGIN

# 2. Push schema to Neon (first time only)
cd server && npm run db:push

# 3. Start both processes
npm run dev:server   # terminal 1 — http://localhost:3000
npm run dev:client   # terminal 2 — http://localhost:5173

# 4. Point the client at the server
echo "VITE_API_URL=http://localhost:3000" > client/.env
```

Register a new account on the login page — sample data is seeded automatically.

## Scripts

Root-level scripts delegate to `client/` or `server/` via `--prefix`:

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npm run dev:client`     | Start the Vite dev server (client)             |
| `npm run dev:server`     | Start the Hono dev server (server)             |
| `npm run build:client`   | Type-check + production build (client)         |
| `npm run build:server`   | Type-check + emit ESM (server)                 |
| `npm run test:client`    | Run client unit/component tests (Vitest)       |
| `npm run test:server`    | Run server tests (Vitest)                      |
| `npm run lint:client`    | Lint client (ESLint)                           |
| `npm run lint:server`    | Lint server (ESLint)                           |

## Deployment

See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for the full guide.
All three services (database, API, client) are hosted on **Railway**.

Push to `main` automatically redeploys both the client and server services.

## Architecture

```
UI (pages, components)        React + Tailwind, dnd-kit drag-and-drop
        │
Auth store (Zustand persist)  src/store/useAuthStore.ts  JWT token + username
        │
App store (Zustand)           src/store/useAppStore.ts   init(token?) swaps repo
        │
Repository interface          src/data/repository.ts     TrackerRepository
        ├── LocalStorageRepository   (no token — dev / offline fallback)
        └── ApiRepository            (token present — fetch + Bearer header)
                                           │
                            Hono REST API  server/src/
                                           │
                            Drizzle ORM → Neon (PostgreSQL)
```

Domain logic lives in pure, unit-tested functions in `client/src/services/`.
The repository boundary is the swap point — the store and UI never know whether
data comes from `localStorage` or the API.

## Tech stack

**Client:** React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS v4 ·
Zustand 5 · dnd-kit · React Router 6 · Vitest + React Testing Library

**Server:** Hono 4 · Drizzle ORM · postgres.js · Neon (serverless PostgreSQL) ·
bcryptjs · JSON Web Tokens

## Documentation

This is an AI-coded-first project with a documentation rule: everything is kept
documented so work can be resumed without re-deriving context.

- [`CLAUDE.md`](./CLAUDE.md) — entry point for AI agents; conventions + the
  documentation rule.
- [`docs/STATUS.md`](./docs/STATUS.md) — current state, what's done, what's next.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — layers, data flow, file map.
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — why things are the way they are.
- [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) — history of changes.
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — Neon + Render + Pages setup.
