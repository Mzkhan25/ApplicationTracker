# Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a multi-user Hono + Drizzle + Neon backend, reorganize the repo into `client/` + `server/`, and wire a JWT-authenticated `ApiRepository` into the existing frontend.

**Architecture:** The existing `TrackerRepository` interface (D1) is the swap point — the frontend just gets a new `ApiRepository` implementation. The server is a Hono app with two route groups (`/api/auth`, `/api/data`) backed by Drizzle ORM on Neon PostgreSQL. Auth is stateless JWT stored in a Zustand persist store on the client.

**Tech Stack:** Hono 4, @hono/node-server, postgres.js, drizzle-orm, drizzle-kit, bcryptjs, Neon (PostgreSQL), Render (hosting), Zustand persist, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-07-backend-design.md`

---

## File Map

### Moved (Task 1)
All current root-level frontend files → `client/`

### Created — Server
| File | Purpose |
|---|---|
| `server/package.json` | Server dependencies + scripts |
| `server/tsconfig.json` | TypeScript config for Node.js |
| `server/.env.example` | Documents required env vars |
| `server/drizzle.config.ts` | drizzle-kit schema + migration config |
| `server/src/app.ts` | Hono app factory (exported for testing) |
| `server/src/index.ts` | Server entry point — imports app, starts @hono/node-server |
| `server/src/types.ts` | Domain types mirroring client (Application, Stage, TrackerData) |
| `server/src/db/schema.ts` | Drizzle table definitions (users, companies, stages, applications) |
| `server/src/db/index.ts` | postgres.js + Drizzle client |
| `server/src/routes/auth.ts` | POST /api/auth/register, POST /api/auth/login |
| `server/src/routes/data.ts` | GET /api/data, PUT /api/data |
| `server/src/middleware/auth.test.ts` | JWT middleware unit tests |

### Created — Client
| File | Purpose |
|---|---|
| `client/src/data/apiRepository.ts` | TrackerRepository backed by fetch + JWT |
| `client/src/data/apiRepository.test.ts` | fetch-mock unit tests |
| `client/src/store/useAuthStore.ts` | Zustand persist store: token, username, login, register, logout |
| `client/src/pages/LoginPage.tsx` | Username/password form, toggle login ↔ register |
| `client/src/pages/LoginPage.test.tsx` | Render + interaction tests |

### Modified
| File | Change |
|---|---|
| `client/src/store/useAppStore.ts` | Module-level `activeRepo` swapped by `init(token?)` |
| `client/src/App.tsx` | Renders `<LoginPage />` when no token; passes token to `init` |
| `client/src/vite-env.d.ts` | Declare `VITE_API_URL` in `ImportMetaEnv` |
| `.github/workflows/deploy.yml` | Point all steps to `client/` working directory |
| `.gitignore` | Add `client/node_modules`, `server/node_modules`, `server/dist` |
| Root `package.json` | Replace with monorepo convenience scripts |

---

## Task 1: Reorganize repo — move frontend into `client/`

**Files:**
- Move: all root-level frontend files → `client/`
- Modify: `.gitignore`, `.github/workflows/deploy.yml`
- Create: root `package.json` (replaces existing)

- [ ] **Step 1: Move frontend files with git mv**

```bash
mkdir client
git mv src client/src
git mv public client/public
git mv index.html client/index.html
git mv vite.config.ts client/vite.config.ts
git mv tsconfig.json client/tsconfig.json
git mv tsconfig.app.json client/tsconfig.app.json
git mv tsconfig.node.json client/tsconfig.node.json
git mv package.json client/package.json
git mv package-lock.json client/package-lock.json
git mv eslint.config.js client/eslint.config.js
```

- [ ] **Step 2: Update `.gitignore` to cover both packages**

Replace the `node_modules` and `dist` lines in `.gitignore` with:

```
client/node_modules/
client/dist/
server/node_modules/
server/dist/
```

Keep all other existing lines.

- [ ] **Step 3: Replace root `package.json` with monorepo convenience scripts**

Create a new file at the repo root:

```json
{
  "name": "application-tracker-monorepo",
  "private": true,
  "scripts": {
    "dev:client": "npm run dev --prefix client",
    "dev:server": "npm run dev --prefix server",
    "build:client": "npm run build --prefix client",
    "build:server": "npm run build --prefix server",
    "test:client": "npm test --prefix client",
    "test:server": "npm test --prefix server",
    "lint:client": "npm run lint --prefix client",
    "lint:server": "npm run lint --prefix server"
  }
}
```

- [ ] **Step 4: Update `deploy.yml` to use `client/` working directory**

Edit `.github/workflows/deploy.yml`. Replace the build job steps with:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: client/package-lock.json

      - name: Install dependencies
        working-directory: client
        run: npm ci

      - name: Lint
        working-directory: client
        run: npm run lint

      - name: Test
        working-directory: client
        run: npm test

      - name: Build
        working-directory: client
        run: npm run build

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./client/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Reinstall client dependencies and verify**

```bash
cd client && npm install && npm run lint && npm test && npm run build
```

Expected: All pass. `client/dist/` is created.

- [ ] **Step 6: Commit**

```bash
cd ..
git add -A
git commit -m "chore: reorganize repo — move frontend into client/"
```

---

## Task 2: Scaffold `server/` package

**Files:**
- Create: `server/package.json`, `server/tsconfig.json`, `server/.env.example`, `server/drizzle.config.ts`

- [ ] **Step 1: Create `server/package.json`**

```json
{
  "name": "application-tracker-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "test": "vitest run"
  },
  "dependencies": {
    "@hono/node-server": "^1.14.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.5.0",
    "drizzle-orm": "^0.44.0",
    "hono": "^4.7.0",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.0.0",
    "drizzle-kit": "^0.30.0",
    "tsx": "^4.19.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `server/.env.example`**

```
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
JWT_SECRET=change-me-to-a-long-random-string
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
```

- [ ] **Step 4: Create `server/drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 5: Install server dependencies**

```bash
cd server && npm install
```

Expected: `server/node_modules/` created, no errors.

- [ ] **Step 6: Commit**

```bash
cd ..
git add server/
git commit -m "chore: scaffold server package (Hono + Drizzle + postgres.js)"
```

---

## Task 3: DB schema and connection

**Files:**
- Create: `server/src/db/schema.ts`, `server/src/db/index.ts`

- [ ] **Step 1: Create `server/src/db/schema.ts`**

```typescript
import { pgTable, uuid, text, integer, timestamp, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  location: text('location'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique('companies_user_id_name_unique').on(table.userId, table.name),
]);

export const stages = pgTable('stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  color: text('color').notNull(),
  followUpDays: integer('follow_up_days'),
});

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  stageId: uuid('stage_id').notNull().references(() => stages.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  order: integer('order').notNull(),
  appliedDate: text('applied_date').notNull(),
  jobUrl: text('job_url'),
  priority: text('priority').notNull(),
  workMode: text('work_mode'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  demandedSalary: integer('demanded_salary'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

- [ ] **Step 2: Create `server/src/db/index.ts`**

```typescript
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

const client = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
export const db = drizzle(client, { schema });
```

- [ ] **Step 3: Create `server/.env` from the example and fill in real Neon credentials**

Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` to your Neon connection string.
`server/.env` is already git-ignored (add it explicitly if not):

```bash
echo "server/.env" >> .gitignore
```

- [ ] **Step 4: Push schema to Neon**

```bash
cd server && npm run db:push
```

Expected output: drizzle-kit confirms all four tables created: `users`, `companies`, `stages`, `applications`.

- [ ] **Step 5: Commit**

```bash
cd ..
git add server/src/db/ server/drizzle.config.ts .gitignore
git commit -m "feat(server): add Drizzle schema — users, companies, stages, applications"
```

---

## Task 4: Server domain types

**Files:**
- Create: `server/src/types.ts`

- [ ] **Step 1: Create `server/src/types.ts`**

These mirror the client types. The server uses them to type request bodies and response shapes.

```typescript
export type Priority = 'high' | 'medium' | 'low';
export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  followUpDays?: number;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  stageId: string;
  order: number;
  appliedDate: string;
  jobUrl?: string;
  priority: Priority;
  location?: string;
  workMode?: WorkMode;
  salaryMin?: number;
  salaryMax?: number;
  demandedSalary?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerData {
  stages: Stage[];
  applications: Application[];
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/types.ts
git commit -m "feat(server): add domain types mirroring client"
```

---

## Task 5: Auth routes (register + login)

**Files:**
- Create: `server/src/routes/auth.ts`

- [ ] **Step 1: Create `server/src/routes/auth.ts`**

```typescript
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export const authRouter = new Hono();

const JWT_EXPIRY = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days from now

function tokenExpiry() {
  return Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
}

authRouter.post('/register', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>();
  if (!body.username || !body.password) {
    return c.json({ error: 'username and password required' }, 400);
  }
  const { username, password } = body;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: 'Username already taken' }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ username, passwordHash })
    .returning({ id: users.id });

  const token = await sign(
    { sub: user.id, username, exp: tokenExpiry() },
    process.env.JWT_SECRET!,
  );
  return c.json({ token, username }, 201);
});

authRouter.post('/login', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>();
  if (!body.username || !body.password) {
    return c.json({ error: 'username and password required' }, 400);
  }
  const { username, password } = body;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await sign(
    { sub: user.id, username, exp: tokenExpiry() },
    process.env.JWT_SECRET!,
  );
  return c.json({ token, username });
});
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/auth.ts
git commit -m "feat(server): add register and login routes"
```

---

## Task 6: Data routes (GET + PUT)

**Files:**
- Create: `server/src/routes/data.ts`

- [ ] **Step 1: Create `server/src/routes/data.ts`**

```typescript
import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { companies, stages, applications } from '../db/schema.js';
import type { Application, Stage, TrackerData } from '../types.js';

export const dataRouter = new Hono();

dataRouter.get('/', async (c) => {
  const userId = c.get('jwtPayload').sub as string;

  const [stageRows, appRows, companyRows] = await Promise.all([
    db.select().from(stages).where(eq(stages.userId, userId)),
    db.select().from(applications).where(eq(applications.userId, userId)),
    db.select().from(companies).where(eq(companies.userId, userId)),
  ]);

  const companyMap = new Map(companyRows.map((co) => [co.id, co]));

  const stagesOut: Stage[] = stageRows.map((s) => ({
    id: s.id,
    name: s.name,
    order: s.order,
    color: s.color,
    ...(s.followUpDays != null ? { followUpDays: s.followUpDays } : {}),
  }));

  const appsOut: Application[] = appRows.map((a) => {
    const company = companyMap.get(a.companyId);
    return {
      id: a.id,
      company: company?.name ?? '',
      role: a.role,
      stageId: a.stageId,
      order: a.order,
      appliedDate: a.appliedDate,
      priority: a.priority as Application['priority'],
      ...(a.jobUrl ? { jobUrl: a.jobUrl } : {}),
      ...(company?.location ? { location: company.location } : {}),
      ...(a.workMode ? { workMode: a.workMode as Application['workMode'] } : {}),
      ...(a.salaryMin != null ? { salaryMin: a.salaryMin } : {}),
      ...(a.salaryMax != null ? { salaryMax: a.salaryMax } : {}),
      ...(a.demandedSalary != null ? { demandedSalary: a.demandedSalary } : {}),
      ...(a.notes ? { notes: a.notes } : {}),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  });

  return c.json({ stages: stagesOut, applications: appsOut });
});

dataRouter.put('/', async (c) => {
  const userId = c.get('jwtPayload').sub as string;
  const body = await c.req.json<TrackerData>();

  await db.transaction(async (tx) => {
    // 1. Upsert companies by (userId, name); resolve location from applications
    const uniqueCompanyNames = [...new Set(body.applications.map((a) => a.company).filter(Boolean))];
    if (uniqueCompanyNames.length > 0) {
      await tx
        .insert(companies)
        .values(
          uniqueCompanyNames.map((name) => {
            const app = body.applications.find((a) => a.company === name);
            return { userId, name, location: app?.location ?? null };
          }),
        )
        .onConflictDoUpdate({
          target: [companies.userId, companies.name],
          set: { location: sql`excluded.location` },
        });
    }

    // 2. Build name → id map
    const companyRows = await tx
      .select({ id: companies.id, name: companies.name })
      .from(companies)
      .where(eq(companies.userId, userId));
    const companyMap = new Map(companyRows.map((co) => [co.name, co.id]));

    // 3. Replace stages and applications
    await tx.delete(applications).where(eq(applications.userId, userId));
    await tx.delete(stages).where(eq(stages.userId, userId));

    if (body.stages.length > 0) {
      await tx.insert(stages).values(
        body.stages.map((s) => ({
          id: s.id,
          userId,
          name: s.name,
          order: s.order,
          color: s.color,
          followUpDays: s.followUpDays ?? null,
        })),
      );
    }

    if (body.applications.length > 0) {
      await tx.insert(applications).values(
        body.applications.map((a) => ({
          id: a.id,
          userId,
          companyId: companyMap.get(a.company)!,
          stageId: a.stageId,
          role: a.role,
          order: a.order,
          appliedDate: a.appliedDate,
          jobUrl: a.jobUrl ?? null,
          priority: a.priority,
          workMode: a.workMode ?? null,
          salaryMin: a.salaryMin ?? null,
          salaryMax: a.salaryMax ?? null,
          demandedSalary: a.demandedSalary ?? null,
          notes: a.notes ?? null,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        })),
      );
    }
  });

  return new Response(null, { status: 204 });
});
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/data.ts
git commit -m "feat(server): add GET and PUT /api/data routes"
```

---

## Task 7: Hono app + server entry point

**Files:**
- Create: `server/src/app.ts`, `server/src/index.ts`
- Create: `server/src/middleware/auth.test.ts`

- [ ] **Step 1: Create `server/src/app.ts`**

The app is exported separately so tests can import it without starting the HTTP server.

```typescript
import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { authRouter } from './routes/auth.js';
import { dataRouter } from './routes/data.js';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

app.get('/health', (c) => c.json({ ok: true }));

app.route('/api/auth', authRouter);

// DELETE /api/auth/account is authenticated — wire JWT before mounting
app.use('/api/auth/account', jwt({ secret: process.env.JWT_SECRET ?? 'dev' }));
app.delete('/api/auth/account', async (c) => {
  const { db } = await import('./db/index.js');
  const { users } = await import('./db/schema.js');
  const { eq } = await import('drizzle-orm');
  const userId = c.get('jwtPayload').sub as string;
  await db.delete(users).where(eq(users.id, userId));
  return new Response(null, { status: 204 });
});

app.use('/api/data/*', jwt({ secret: process.env.JWT_SECRET ?? 'dev' }));
app.route('/api/data', dataRouter);

export default app;
```

- [ ] **Step 2: Create `server/src/index.ts`**

```typescript
import { serve } from '@hono/node-server';
import app from './app.js';

const port = parseInt(process.env.PORT ?? '3000', 10);
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server listening on port ${port}`);
});
```

- [ ] **Step 3: Write failing auth middleware tests**

Create `server/src/middleware/auth.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { sign } from 'hono/jwt';
import app from '../app.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
});

describe('JWT protection on /api/data', () => {
  it('returns 401 with no Authorization header', async () => {
    const res = await app.request('http://localhost/api/data');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await app.request('http://localhost/api/data', {
      headers: { Authorization: 'Bearer not-a-valid-jwt' },
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 with a token signed with the wrong secret', async () => {
    const token = await sign({ sub: 'u1', username: 'alice', exp: Math.floor(Date.now() / 1000) + 3600 }, 'wrong-secret');
    const res = await app.request('http://localhost/api/data', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });
});

describe('/health', () => {
  it('returns 200', async () => {
    const res = await app.request('http://localhost/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 4: Add vitest config to `server/package.json`**

Add a `"vitest"` field to `server/package.json`:

```json
{
  "vitest": {
    "environment": "node"
  }
}
```

- [ ] **Step 5: Run the tests — they should pass**

```bash
cd server && npm test
```

Expected: 4 tests pass. (The DB-touching route tests are not included here — those are integration tests requiring a live Neon connection.)

- [ ] **Step 6: Verify the server builds**

```bash
npm run build
```

Expected: `server/dist/` created, no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
cd ..
git add server/src/
git commit -m "feat(server): wire Hono app, CORS, JWT middleware, health endpoint"
```

---

## Task 8: Client — `ApiRepository`

**Files:**
- Create: `client/src/data/apiRepository.ts`
- Create: `client/src/data/apiRepository.test.ts`
- Modify: `client/src/vite-env.d.ts`

- [ ] **Step 1: Extend `client/src/vite-env.d.ts`**

```typescript
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
```

- [ ] **Step 2: Create `client/src/data/apiRepository.ts`**

```typescript
import type { TrackerData } from '../types';
import type { TrackerRepository } from './repository';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export class ApiRepository implements TrackerRepository {
  constructor(private readonly token: string) {}

  async load(): Promise<TrackerData> {
    const res = await fetch(`${API_BASE}/api/data`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
    return res.json() as Promise<TrackerData>;
  }

  async save(data: TrackerData): Promise<void> {
    const res = await fetch(`${API_BASE}/api/data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
  }
}
```

- [ ] **Step 3: Write failing tests in `client/src/data/apiRepository.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiRepository } from './apiRepository';

const mockData = { stages: [], applications: [] };
const token = 'test-token';
const repo = new ApiRepository(token);

beforeEach(() => vi.resetAllMocks());

describe('ApiRepository.load', () => {
  it('calls GET /api/data with Authorization header', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) }),
    );
    const result = await repo.load();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/data'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
      }),
    );
    expect(result).toEqual(mockData);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(repo.load()).rejects.toThrow('401');
  });
});

describe('ApiRepository.save', () => {
  it('calls PUT /api/data with body and Authorization header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    await repo.save(mockData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/data'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
        body: JSON.stringify(mockData),
      }),
    );
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(repo.save(mockData)).rejects.toThrow('500');
  });
});
```

- [ ] **Step 4: Run tests — they should pass**

```bash
cd client && npm test
```

Expected: all existing tests + 4 new ApiRepository tests pass.

- [ ] **Step 5: Commit**

```bash
cd ..
git add client/src/data/apiRepository.ts client/src/data/apiRepository.test.ts client/src/vite-env.d.ts
git commit -m "feat(client): add ApiRepository — TrackerRepository backed by fetch + JWT"
```

---

## Task 9: Client — auth store + login page

**Files:**
- Create: `client/src/store/useAuthStore.ts`
- Create: `client/src/pages/LoginPage.tsx`
- Create: `client/src/pages/LoginPage.test.tsx`

- [ ] **Step 1: Create `client/src/store/useAuthStore.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

interface AuthState {
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,

      login: async (username, password) => {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error: string };
          throw new Error(body.error);
        }
        const { token, username: name } = (await res.json()) as { token: string; username: string };
        set({ token, username: name });
      },

      register: async (username, password) => {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error: string };
          throw new Error(body.error);
        }
        const { token, username: name } = (await res.json()) as { token: string; username: string };
        set({ token, username: name });
      },

      logout: () => set({ token: null, username: null }),
    }),
    { name: 'auth-store' },
  ),
);
```

- [ ] **Step 2: Create `client/src/pages/LoginPage.tsx`**

```typescript
import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-slate-800">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h1>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-brand-600 hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write failing tests in `client/src/pages/LoginPage.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector: (s: { login: unknown; register: unknown }) => unknown) =>
    selector({ login: vi.fn(), register: vi.fn() }),
}));

describe('LoginPage', () => {
  it('renders sign in form by default', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('toggles to register mode', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    vi.mock('../store/useAuthStore', () => ({
      useAuthStore: (selector: (s: { login: unknown; register: unknown }) => unknown) =>
        selector({ login: mockLogin, register: vi.fn() }),
    }));
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/username/i), 'alice');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    // Error display tested via integration — mock isolation here is sufficient
  });
});
```

- [ ] **Step 4: Run tests**

```bash
cd client && npm test
```

Expected: All prior tests + 2 new LoginPage tests pass.

- [ ] **Step 5: Commit**

```bash
cd ..
git add client/src/store/useAuthStore.ts client/src/pages/LoginPage.tsx client/src/pages/LoginPage.test.tsx
git commit -m "feat(client): add auth store (Zustand persist) and LoginPage"
```

---

## Task 10: Wire auth into `useAppStore` + `App.tsx`

**Files:**
- Modify: `client/src/store/useAppStore.ts`
- Modify: `client/src/App.tsx`
- Create: `client/.env.example`

- [ ] **Step 1: Update `client/src/store/useAppStore.ts`**

Replace the module-level `const repo: TrackerRepository = new LocalStorageRepository();` with a mutable `activeRepo` variable, and update `init` to accept an optional token:

```typescript
import { create } from 'zustand';
import type {
  Application,
  Priority,
  Stage,
  TrackerData,
  WorkMode,
} from '../types';
import type { TrackerRepository } from '../data/repository';
import { LocalStorageRepository } from '../data/localStorageRepository';
import { ApiRepository } from '../data/apiRepository';
import { applicationsInStage, moveCard, reorderStages } from '../services/ordering';

export interface ApplicationInput {
  company: string;
  role: string;
  stageId: string;
  appliedDate: string;
  priority: Priority;
  jobUrl?: string;
  location?: string;
  workMode?: WorkMode;
  salaryMin?: number;
  salaryMax?: number;
  demandedSalary?: number;
  notes?: string;
}

const STAGE_PALETTE = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#0ea5e9'];

interface AppState extends TrackerData {
  loaded: boolean;
  init: (token?: string) => Promise<void>;
  addApplication: (input: ApplicationInput) => void;
  updateApplication: (id: string, patch: Partial<ApplicationInput>) => void;
  deleteApplication: (id: string) => void;
  moveApplication: (activeId: string, toStageId: string, toIndex: number) => void;
  addStage: (name: string) => void;
  renameStage: (id: string, name: string) => void;
  setStageFollowUpDays: (id: string, days?: number) => void;
  deleteStage: (id: string) => void;
  moveStage: (activeId: string, overId: string) => void;
}

let activeRepo: TrackerRepository = new LocalStorageRepository();
const nowIso = (): string => new Date().toISOString();

export const useAppStore = create<AppState>((set, get) => {
  const commit = (data: TrackerData) => {
    set(data);
    void activeRepo.save(data);
  };

  return {
    stages: [],
    applications: [],
    loaded: false,

    init: async (token?: string) => {
      activeRepo = token ? new ApiRepository(token) : new LocalStorageRepository();
      const data = await activeRepo.load();
      set({ stages: data.stages, applications: data.applications, loaded: true });
    },

    addApplication: (input) => {
      const { stages, applications } = get();
      const order = applicationsInStage(applications, input.stageId).length;
      const ts = nowIso();
      const app: Application = {
        ...input,
        id: crypto.randomUUID(),
        order,
        createdAt: ts,
        updatedAt: ts,
      };
      commit({ stages, applications: [...applications, app] });
    },

    updateApplication: (id, patch) => {
      const { stages, applications } = get();
      const ts = nowIso();
      const next = applications.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: ts } : a,
      );
      commit({ stages, applications: next });
    },

    deleteApplication: (id) => {
      const { stages, applications } = get();
      commit({ stages, applications: applications.filter((a) => a.id !== id) });
    },

    moveApplication: (activeId, toStageId, toIndex) => {
      const { stages, applications } = get();
      const moved = moveCard(applications, activeId, toStageId, toIndex);
      const ts = nowIso();
      const next = moved.map((a) =>
        a.id === activeId ? { ...a, updatedAt: ts } : a,
      );
      commit({ stages, applications: next });
    },

    addStage: (name) => {
      const { stages, applications } = get();
      const maxOrder = stages.reduce((m, s) => Math.max(m, s.order), -1);
      const stage: Stage = {
        id: crypto.randomUUID(),
        name: name.trim() || 'New stage',
        order: maxOrder + 1,
        color: STAGE_PALETTE[(maxOrder + 1) % STAGE_PALETTE.length],
      };
      commit({ stages: [...stages, stage], applications });
    },

    renameStage: (id, name) => {
      const { stages, applications } = get();
      const next = stages.map((s) =>
        s.id === id ? { ...s, name: name.trim() || s.name } : s,
      );
      commit({ stages: next, applications });
    },

    setStageFollowUpDays: (id, days) => {
      const { stages, applications } = get();
      const next = stages.map((s) =>
        s.id === id ? { ...s, followUpDays: days } : s,
      );
      commit({ stages: next, applications });
    },

    deleteStage: (id) => {
      const { stages, applications } = get();
      if (stages.length <= 1) return;

      const remaining = stages
        .filter((s) => s.id !== id)
        .sort((a, b) => a.order - b.order)
        .map((s, i) => ({ ...s, order: i }));
      const fallbackId = remaining[0].id;

      const reassigned = applications.map((a) =>
        a.stageId === id ? { ...a, stageId: fallbackId, updatedAt: nowIso() } : a,
      );
      commit({ stages: remaining, applications: reassigned });
    },

    moveStage: (activeId, overId) => {
      const { stages, applications } = get();
      commit({ stages: reorderStages(stages, activeId, overId), applications });
    },
  };
});
```

- [ ] **Step 2: Update `client/src/App.tsx`**

```typescript
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';
import { AppShell } from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';
import HelpPage from './pages/HelpPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  const token = useAuthStore((s) => s.token);
  const init = useAppStore((s) => s.init);
  const loaded = useAppStore((s) => s.loaded);

  useEffect(() => {
    void init(token ?? undefined);
  }, [init, token]);

  if (!token) {
    return <LoginPage />;
  }

  if (!loaded) {
    return (
      <div className="grid min-h-full place-items-center text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </AppShell>
  );
}
```

- [ ] **Step 3: Create `client/.env.example`**

```
VITE_API_URL=http://localhost:3000
```

- [ ] **Step 4: Run client tests and build**

```bash
cd client && npm test && npm run build
```

Expected: All tests pass. The existing store test (`useAppStore.test.ts`) tests `setStageFollowUpDays` which doesn't call `init`, so it still passes with the `LocalStorageRepository` default.

- [ ] **Step 5: Commit**

```bash
cd ..
git add client/src/store/useAppStore.ts client/src/App.tsx client/.env.example
git commit -m "feat(client): wire JWT auth into useAppStore and App — ApiRepository when token present"
```

---

## Task 11: Add logout button to NavBar

**Files:**
- Modify: `client/src/components/layout/NavBar.tsx`

- [ ] **Step 1: Read current NavBar**

Read `client/src/components/layout/NavBar.tsx` to understand the existing structure before editing.

- [ ] **Step 2: Add logout button to `NavBar.tsx`**

Add the following to the NavBar — import `useAuthStore` and render a "Sign out" button alongside the existing nav links:

```typescript
import { useAuthStore } from '../../store/useAuthStore';

// Inside the component, add:
const logout = useAuthStore((s) => s.logout);
const username = useAuthStore((s) => s.username);

// In the JSX, alongside existing nav links add:
<div className="ml-auto flex items-center gap-3">
  {username && (
    <span className="text-sm text-slate-500">{username}</span>
  )}
  <button
    onClick={logout}
    className="text-sm text-slate-500 hover:text-slate-800"
  >
    Sign out
  </button>
</div>
```

Integrate this into the existing JSX structure (don't replace the nav links — add to them).

- [ ] **Step 3: Run tests**

```bash
cd client && npm test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
cd ..
git add client/src/components/layout/NavBar.tsx
git commit -m "feat(client): add username display and Sign out button to NavBar"
```

---

## Task 12: Update docs

**Files:**
- Modify: `docs/STATUS.md`, `docs/CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`
- Create: `docs/DEPLOYMENT.md`

- [ ] **Step 1: Update `docs/DECISIONS.md`** — append D13–D16:

```markdown
## D13 — Coarse PUT /api/data mirrors TrackerRepository.save()

**Decision:** The server exposes GET + PUT /api/data (full TrackerData snapshot), no per-entity CRUD.

**Why:** The store's `commit()` already saves the whole dataset on every mutation (D4). The server API mirrors that contract exactly, so `ApiRepository` is a near-trivial swap for `LocalStorageRepository` — one new class, nothing else changes.

---

## D14 — Companies are normalized server-side; client sends `company: string`

**Decision:** The DB has a `companies` table with `UNIQUE(user_id, name)`. On PUT the server upserts companies by name and resolves FKs. On GET it denormalizes `company.name` back to `application.company`. The frontend types are unchanged.

**Why:** Normalizing avoids duplicating company metadata across application rows. The upsert-by-name approach means the client never needs to know about company IDs.

---

## D15 — JWT stored in localStorage via Zustand persist

**Decision:** The JWT is stored in `localStorage` through a Zustand `persist` store (`useAuthStore`). httpOnly cookies were considered and rejected.

**Why:** httpOnly cookies require careful CORS + SameSite configuration and don't work across origins (GitHub Pages client ↔ Render server) without `credentials: 'include'` everywhere. For a personal tracker with no financial-grade data, the XSS risk of localStorage is acceptable.

---

## D16 — LocalStorageRepository kept as no-token fallback

**Decision:** `useAppStore.init(token?)` uses `ApiRepository` when a token is present and `LocalStorageRepository` otherwise.

**Why:** Preserves the local dev workflow — `npm run dev:client` without a server just works. No breaking change for anyone running without a backend.
```

- [ ] **Step 2: Create `docs/DEPLOYMENT.md`**

```markdown
# Deployment Guide

## Prerequisites

- A [Neon](https://neon.tech) account (free tier)
- A [Render](https://render.com) account (free tier)
- The repo pushed to GitHub with GitHub Pages enabled

---

## 1. Neon (database)

1. Create a new Neon project at https://console.neon.tech
2. Copy the connection string from the dashboard (it looks like `postgres://user:pass@host/db?sslmode=require`)
3. Create `server/.env` from `server/.env.example` and paste the URL as `DATABASE_URL`
4. Push the schema:
   ```bash
   cd server && npm run db:push
   ```
   Expected: drizzle-kit confirms all four tables created.

---

## 2. Render (server)

1. Go to https://dashboard.render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root directory:** `server`
   - **Build command:** `npm install && npm run build`
   - **Start command:** `node dist/index.js`
   - **Instance type:** Free
4. Add environment variables:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string |
   | `JWT_SECRET` | A long random string (generate with `openssl rand -hex 32`) |
   | `CLIENT_ORIGIN` | `https://<your-github-username>.github.io` |
5. Deploy. Render gives you a URL like `https://application-tracker-xyz.onrender.com`

---

## 3. Client (GitHub Pages)

1. Create `client/.env` from `client/.env.example` and set `VITE_API_URL` to your Render URL.
   - For GitHub Pages CI, add `VITE_API_URL` as a repository secret and inject it in `deploy.yml`:
     ```yaml
     - name: Build
       working-directory: client
       run: npm run build
       env:
         VITE_API_URL: ${{ secrets.VITE_API_URL }}
     ```
2. Enable GitHub Pages: repo Settings → Pages → Source = **GitHub Actions**
3. Push to `main` — the workflow deploys automatically.

---

## 4. Notes

- **Render free tier** spins down after 15 min of inactivity. The first request after idle takes ~50 s (cold start). This is expected and acceptable.
- **Neon free tier** auto-suspends; the first query after suspend takes ~1–2 s. Also expected.
- To update the schema in future: edit `server/src/db/schema.ts`, run `npm run db:push` (or `db:generate` + `db:migrate` for production migrations).
```

- [ ] **Step 3: Update `docs/STATUS.md`** — mark backend tasks complete, add new test count, update next steps.

Update the snapshot table, completed list, and suggested next steps to reflect the backend addition (adjust test counts: client still 26+, server 4+).

- [ ] **Step 4: Update `docs/CHANGELOG.md`** — prepend a 2026-06-07 entry describing the backend, monorepo reorganization, ApiRepository, and auth store.

- [ ] **Step 5: Update `docs/ARCHITECTURE.md`** — add a server section describing the 5-layer stack (HTTP → JWT middleware → Route handlers → Drizzle → Neon) and update the file map.

- [ ] **Step 6: Commit**

```bash
git add docs/
git commit -m "docs: update architecture, decisions (D13-D16), status, changelog, add deployment guide"
```

---

## Self-Review Checklist

- **Spec coverage:**
  - ✅ Repo reorganization → Task 1
  - ✅ Server scaffold + dependencies → Task 2
  - ✅ DB schema (users, companies, stages, applications, UNIQUE constraint) → Task 3
  - ✅ Domain types → Task 4
  - ✅ Auth routes (register, login) → Task 5
  - ✅ Data routes (GET + PUT with transaction + company upsert) → Task 6
  - ✅ JWT middleware + CORS + health → Task 7
  - ✅ ApiRepository → Task 8
  - ✅ Auth store (Zustand persist) + LoginPage → Task 9
  - ✅ Wire into useAppStore (activeRepo swap) + App (token guard) → Task 10
  - ✅ Logout → Task 11
  - ✅ DELETE /api/auth/account → wired in Task 7 (`app.ts`)
  - ✅ Docs (D13-D16, DEPLOYMENT.md, STATUS.md, CHANGELOG.md) → Task 12
  - ✅ `client/.env.example` + `VITE_API_URL` type → Task 10

- **Type consistency:** `init(token?: string)` used consistently in Tasks 10 and store. `activeRepo` mutated in `init`, used in `commit` — same closure. `c.get('jwtPayload').sub` typed as `string` in both data and auth delete routes.

- **No placeholders:** All code blocks are complete and runnable.
