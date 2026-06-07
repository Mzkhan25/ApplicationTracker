# Backend Design — Application Tracker

**Date:** 2026-06-07
**Status:** Approved, ready for implementation

---

## Overview

Add a multi-user backend to the Application Tracker so users can persist data in the cloud rather than only in browser `localStorage`. Authentication is username + password. The backend is independently hostable on free-tier services.

---

## Repo Reorganization

The repository becomes a monorepo with two independent packages:

```
ApplicationTracker/
  client/               ← all current root-level frontend files
    src/
    public/
    index.html
    vite.config.ts
    tsconfig*.json
    package.json

  server/               ← new Hono backend
    src/
      index.ts
      routes/
        auth.ts
        data.ts
      db/
        schema.ts
        index.ts
        migrations/
      middleware/
        auth.ts
    package.json
    tsconfig.json
    .env.example

  docs/                 ← unchanged
  .github/
  package.json          ← root convenience scripts only (no npm workspaces)
```

The root `package.json` delegates to each subfolder via scripts (e.g. `npm run dev:client`, `npm run dev:server`). No npm workspaces — keeps it simple.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Hono | TypeScript-first, minimal boilerplate, excellent DX |
| ORM | Drizzle | Lightweight, SQL-like syntax, type-safe, pairs well with Neon |
| Database | Neon (PostgreSQL) | Free tier (0.5 GB), serverless, no expiry |
| Hosting | Render | Free web service tier, no expiry |
| Auth | JWT + bcrypt | Stateless, works well with Render's spin-down/cold-start behavior |

---

## Database Schema

```sql
users
  id            uuid  PRIMARY KEY  DEFAULT gen_random_uuid()
  username      text  UNIQUE NOT NULL
  password_hash text  NOT NULL
  created_at    timestamptz DEFAULT now()

companies
  id         uuid  PRIMARY KEY  DEFAULT gen_random_uuid()
  user_id    uuid  NOT NULL REFERENCES users(id) ON DELETE CASCADE
  name       text  NOT NULL
  location   text
  created_at timestamptz DEFAULT now()
  UNIQUE(user_id, name)

stages
  id             uuid  PRIMARY KEY  DEFAULT gen_random_uuid()
  user_id        uuid  NOT NULL REFERENCES users(id) ON DELETE CASCADE
  name           text  NOT NULL
  order          integer NOT NULL
  color          text  NOT NULL
  follow_up_days integer          -- NULL = reminders off for this stage

applications
  id              uuid  PRIMARY KEY  DEFAULT gen_random_uuid()
  user_id         uuid  NOT NULL REFERENCES users(id) ON DELETE CASCADE
  company_id      uuid  NOT NULL REFERENCES companies(id) ON DELETE CASCADE
  stage_id        uuid  NOT NULL REFERENCES stages(id) ON DELETE CASCADE
  role            text  NOT NULL
  order           integer NOT NULL
  applied_date    text  NOT NULL   -- ISO date string, matches existing client type
  job_url         text
  priority        text  NOT NULL   -- 'high'|'medium'|'low'
  work_mode       text             -- 'remote'|'hybrid'|'onsite'
  salary_min      integer
  salary_max      integer
  demanded_salary integer
  notes           text
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()
```

**Key invariants:**
- `ON DELETE CASCADE` on all child tables — deleting a user wipes all their data cleanly
- `company_id` in `applications` always references a company owned by the same user (validated server-side before write)
- `stage_id` in `applications` always references a stage owned by the same user (validated server-side before write)

---

## API Design

All routes prefixed `/api`. Auth routes are public. All `/api/data` routes require `Authorization: Bearer <token>`.

### Auth

```
POST /api/auth/register
  body:    { username: string, password: string }
  returns: { token: string, username: string }
  errors:  409 if username already taken

POST /api/auth/login
  body:    { username: string, password: string }
  returns: { token: string, username: string }
  errors:  401 if credentials invalid

DELETE /api/auth/account
  (authenticated)
  — deletes the user row; CASCADE removes all their data
  returns: 204 No Content
```

### Data

```
GET /api/data
  (authenticated)
  returns: TrackerData { stages: Stage[], applications: Application[] }
  — applications include company (string) denormalized from companies table
  — returns empty stages + applications for a new user (no server-side seeding)

PUT /api/data
  (authenticated)
  body:    TrackerData { stages: Stage[], applications: Application[] }
  — upserts companies by (user_id, name), resolves company_id automatically
  — validates all stage_id and company_id values belong to the authenticated user
  — replaces all stages + applications for the user in a single transaction
  returns: 204 No Content
```

### Error shape

All errors return `{ error: string }` with an appropriate HTTP status code.

---

## Server Architecture

```
HTTP request
  → Hono router
    → JWT middleware (verifies Bearer token, attaches userId to ctx)
      → Route handler
        → Drizzle ORM query
          → Neon (PostgreSQL)
```

**`PUT /api/data` transaction sequence:**
1. Parse and validate request body
2. Upsert companies: `INSERT ... ON CONFLICT (user_id, name) DO UPDATE SET location = excluded.location`
3. Build `name → id` map for companies
4. Delete all existing stages and applications for the user
5. Insert new stages
6. Insert new applications (resolving `company_id` from step 3)
7. Commit — all in one transaction

**Auth middleware** verifies the JWT signature and expiry, extracts `userId`, and attaches it to the Hono context. Any verification failure returns 401.

---

## Client Changes

The `TrackerRepository` seam (D1) means the store and all UI are untouched. Changes are confined to the data layer, auth store, and routing.

### New files

| File | Purpose |
|---|---|
| `client/src/data/apiRepository.ts` | Implements `TrackerRepository`; calls `GET /api/data` and `PUT /api/data` with JWT header |
| `client/src/store/useAuthStore.ts` | Zustand store: `{ token, username }`; persisted to `localStorage`; exposes `login`, `register`, `logout` |
| `client/src/pages/LoginPage.tsx` | Single page with username/password form; toggle between login and register mode |

### Modified files

| File | Change |
|---|---|
| `client/src/store/useAppStore.ts` | Constructs `ApiRepository` when token present, `LocalStorageRepository` otherwise |
| `client/src/App.tsx` | Protected route guard — no token redirects to `/login`; `/login` is the only public route |

### Client auth flow

1. User visits app → no token in `useAuthStore` → redirected to `/login`
2. Login/register → server returns JWT → stored in `useAuthStore` → `useAppStore` re-initializes with `ApiRepository` → loads data from server
3. Logout → token cleared → redirected to `/login` → `useAppStore` resets to empty state

### Type compatibility

`Application` on the client retains `company: string`. The `ApiRepository` maps between the flat client shape and the server's `company_id` FK — the frontend types do not change.

---

## Hosting Setup

**Neon (database):**
1. Create a free Neon project
2. Copy the connection string into `server/.env` as `DATABASE_URL`
3. Run `npm run db:migrate` from `server/` to apply the schema

**Render (server):**
1. Connect the GitHub repo
2. Set root directory to `server/`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables: `DATABASE_URL`, `JWT_SECRET`

**GitHub Actions:**
- Existing `deploy.yml` builds and deploys the client to GitHub Pages — unchanged
- No server CI needed initially; Render auto-deploys on push to `main`

---

## Design Decisions Captured

| ID | Decision |
|---|---|
| D13 | Coarse `PUT /api/data` mirrors `TrackerRepository.save()` — no per-entity CRUD endpoints, consistent with D1 |
| D14 | Companies are normalized into their own table with `user_id` FK; client still sends `company: string` and the server resolves the FK via upsert |
| D15 | JWT stored in `localStorage` (via `useAuthStore`); httpOnly cookies rejected as they add CORS complexity for a personal tracker with no sensitive financial data |
| D16 | `LocalStorageRepository` kept as fallback when no token is present — dev workflow unaffected, no breaking change |

---

## Definition of Done

- `npm run lint`, `npm run build`, `npm test` pass in both `client/` and `server/`
- `docs/STATUS.md`, `docs/CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` updated
- Render + Neon setup documented in `docs/DEPLOYMENT.md`
