# Architecture

How the Application Tracker is structured. Pair this with `DECISIONS.md` (why)
and `STATUS.md` (current state).

## Layered design

```
┌─────────────────────────────────────────────────────────────┐
│ UI            React components + Tailwind, dnd-kit drag/drop  │
│               src/pages/, src/components/                     │
├─────────────────────────────────────────────────────────────┤
│ State         Zustand store — in-memory source of truth       │
│               src/store/useAppStore.ts                        │
├─────────────────────────────────────────────────────────────┤
│ Domain        Pure functions: ordering, metrics, follow-ups   │
│ services      src/services/                                   │
├─────────────────────────────────────────────────────────────┤
│ Repository    Persistence contract (interface)                │
│ interface     src/data/repository.ts                          │
├─────────────────────────────────────────────────────────────┤
│ Storage       LocalStorageRepository (the swap point)         │
│               src/data/localStorageRepository.ts              │
└─────────────────────────────────────────────────────────────┘
```

**Key rule:** dependencies point downward only. The UI and store depend on the
repository *interface*, never on `localStorage`. Swapping in a backend later
means writing one new class implementing `TrackerRepository` and changing the
one line in `useAppStore.ts` that constructs `repo`.

## Data flow

**Startup:** `App.tsx` calls `useAppStore.init()` on mount → `repo.load()` reads
`localStorage` (seeding defaults + sample data on first run) → store holds
`{ stages, applications, loaded: true }` → pages render.

**Mutation (e.g. drag a card):** component calls a store action (e.g.
`moveApplication`) → action computes the next dataset using a pure service
(e.g. `moveCard`) → the store's private `commit()` sets state **and** calls
`repo.save()`. Persistence is centralized in `commit()`, so every mutation is
saved exactly once.

**Read/derive (dashboard):** `DashboardPage` selects `stages` + `applications`
from the store and feeds them to pure metric/activity/follow-up services inside
a `useMemo`. Widgets are pure presentational components receiving props.

## Data model (`src/types.ts`)

- `Priority` = `'high' | 'medium' | 'low'`
- `WorkMode` = `'remote' | 'hybrid' | 'onsite'`
- `Stage` = `{ id, name, order, color, followUpDays? }` — a board column;
  user-editable. `followUpDays` is the per-column follow-up window (unset = no
  reminders for that column).
- `Application` = `{ id, company, role, stageId, order, appliedDate, jobUrl?,
  priority, location?, workMode?, salaryMin?, salaryMax?, notes?, createdAt,
  updatedAt }` — one card.
- `TrackerData` = `{ stages, applications }` — the unit the repository
  loads/saves.

**Ordering:** `Stage.order` (ascending) places columns left→right.
`Application.order` (ascending) places cards top→bottom within a stage. Ordering
is recomputed by pure functions in `src/services/ordering.ts`.

**Timestamps:** `updatedAt` drives recent-activity sorting and follow-up
staleness. `createdAt` is set once. Any move/edit bumps `updatedAt`.

## File map

```
src/
  main.tsx                  React root; BrowserRouter (v7 future flags on)
  App.tsx                   Store init + routes (/ Dashboard, /board Board,
                            /help How to use)
  index.css                 Tailwind import + @theme tokens + base styles
  types.ts                  Domain types (above)

  data/
    repository.ts           TrackerRepository interface (load/save)
    localStorageRepository.ts  localStorage impl; seeds on first load
    seed.ts                 createDefaultStages() + createSeedData()
    localStorageRepository.test.ts

  store/
    useAppStore.ts          Zustand store + ApplicationInput type.
                            Actions: init, addApplication, updateApplication,
                            deleteApplication, moveApplication, addStage,
                            renameStage, setStageFollowUpDays, deleteStage,
                            moveStage.
                            Private commit() persists every change.

  services/                 PURE, unit-tested, no React:
    ordering.ts             applicationsInStage, moveCard, reorderStages
    metrics.ts              stageCounts, pipelineSummary (StageCount,
                            PipelineSummary types)
    followups.ts            daysSince, staleApplications(apps, stages, now)
                            — per-stage windows via Stage.followUpDays
    activity.ts             recentApplications
    services.test.ts

  pages/
    DashboardPage.tsx       Wires services → dashboard widgets
    BoardPage.tsx           Board + add/edit application modal
    HelpPage.tsx            Static "How to use" instructions (all features)
    BoardPage.test.tsx, DashboardPage.test.tsx, HelpPage.test.tsx  (integration)

  components/
    layout/   AppShell (header+nav), NavBar (Dashboard/Board/How-to-use links)
    common/   Button, Badge, PriorityTag, Modal  (reusable primitives)
    board/    Board (DndContext orchestration), Column (droppable + kebab
              menu + inline rename), Card (sortable, grip handle),
              ApplicationForm (Field-wrapped inputs), AddColumn
    dashboard/ Panel (section wrapper), StatTiles, StageCounts,
              PipelineBreakdown (SVG donut), RecentActivity, FollowUpList

  utils/
    format.ts               formatSalary, formatShortDate, workModeLabel,
                            relativeDay
    donut.ts                donutSegments — pure SVG donut arc geometry
    donut.test.ts

  test/
    setup.ts                jest-dom; clears DOM + localStorage after each test
```

## How drag-and-drop works (board)

- `Board` wraps everything in a single dnd-kit `DndContext` (cards only; column
  reordering uses the Column kebab menu's "Move left/right", which call
  `moveStage`).
- Each `Column` is a `useDroppable` target (so empty columns accept drops) and
  wraps its cards in a `SortableContext`.
- Each `Card` is `useSortable`; a dedicated grip handle holds the drag
  listeners, while the card body is a button that opens the edit modal. A
  `PointerSensor` distance constraint (5px) prevents accidental drags on click.
- On `onDragEnd`, `Board` resolves the target stage (the `over` id is either a
  stage's droppable id or a card id → look up its `stageId`) and the target
  index, then calls `moveApplication(activeId, toStageId, toIndex)`. The pure
  `moveCard` recomputes `order` for affected columns; the store bumps the moved
  card's `updatedAt` and persists.

## Persistence details

- Single `localStorage` key: `application-tracker:data`, holding the full
  `TrackerData` as JSON.
- First load (key absent) → `createSeedData()` produces the 5 default columns +
  4 sample applications (one intentionally stale to demonstrate follow-ups),
  then saves them.
- IDs use `crypto.randomUUID()`.
