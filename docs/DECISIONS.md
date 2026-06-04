# Design Decisions

ADR-style record of non-obvious choices and why they were made. Add a new entry
whenever you make a decision a future agent might otherwise second-guess or
accidentally undo.

Format: **Decision · Why · Alternatives rejected**.

---

## D1 — Local-first storage behind a repository interface

**Decision:** Persist to `localStorage`, but only through a `TrackerRepository`
interface (`load`/`save` the whole dataset). The store/UI never touch
`localStorage` directly.

**Why:** The user wanted "local now, backend later." The interface is the seam:
adding an HTTP/DB backend means one new class + one construction line, no UI
changes.

**Alternatives rejected:** Direct `localStorage` calls in components (no swap
path). Fine-grained per-entity CRUD repository (more surface than needed when the
in-memory store is the source of truth and the dataset is tiny — coarse
load/save is simpler and sufficient).

---

## D2 — Stages are user-editable and carry NO fixed semantics

**Decision:** A `Stage` is just `{ id, name, order, color }`. No `isOffer`,
`isRejected`, or category flag. All metrics are computed without referencing
stage names.

**Why:** Columns can be renamed, reordered, added, and deleted. Any logic that
hardcoded "Offer" or "Rejected" would silently break when a user edits columns.

**Consequences / how metrics stay honest:**
- **Response rate** = share of applications that moved *past the first stage*
  (`(total − firstStageCount) / total`). Survives any renaming/reordering.
- **Follow-ups** = pure staleness (`updatedAt` older than N days), independent of
  stage.
- **Funnel** = per-stage current counts as tapering bars (distribution), not a
  cumulative "reached stage X" that would require knowing which stages are
  terminal.
- **Dashboard "Companies" tile** replaced a would-be "Offers" tile, because
  "offers" can't be identified without stage semantics.

**Alternatives rejected:** Adding a `category: 'active'|'won'|'lost'` field to
stages. It would enable richer conversion metrics but adds editing UI and scope
the user didn't ask for. Revisit if the user wants true win/loss conversion.

---

## D3 — Column reordering via buttons, not drag

**Decision:** Cards are drag-and-drop (dnd-kit). Columns are reordered with
"Move left / Move right" actions in each column's kebab menu (`moveStage`).

**Why:** Nesting a sortable column context inside a sortable card context in one
`DndContext` is a well-known source of collision-detection bugs. Buttons are
simpler, fully keyboard-accessible, and satisfy "reorder columns."

**Alternatives rejected:** Draggable columns (fragile, more code). The newer
`@dnd-kit/react` `move` helper (would change the whole DnD approach).

---

## D4 — Single Zustand store with a centralized `commit()`

**Decision:** One store holds `{ stages, applications, loaded }`. Every mutation
computes the next dataset and calls a private `commit(data)` that both sets state
and calls `repo.save(data)`.

**Why:** Guarantees "save after every change" lives in exactly one place rather
than being repeated (and forgotten) across nine actions.

**Alternatives rejected:** React Context + useReducer (more boilerplate).
Zustand `persist` middleware (couples persistence to the store shape and bypasses
the repository seam from D1).

---

## D5 — Pure services, isolated from React and the clock

**Decision:** Ordering, metrics, follow-ups, and activity logic are pure
functions in `src/services/`. Time-dependent functions take `now: Date =
new Date()` as a parameter.

**Why:** Pure logic is trivially testable (no rendering, no mocking) and
deterministic when the clock is injected. The suite runs in well under a second.

**Alternatives rejected:** Logic inside components/store (hard to test, couples
business rules to UI). Calling `Date.now()` internally (non-deterministic tests).

---

## D6 — Tailwind v4 CSS-first config

**Decision:** Use the `@tailwindcss/vite` plugin with `@import "tailwindcss"` and
an `@theme` block in `src/index.css` for custom tokens (e.g. `brand-600`). No
`tailwind.config.js`.

**Why:** This is the current v4 idiom; tokens defined in `@theme` auto-generate
utilities. Less config to maintain.

---

## D7 — Form accessibility via `Field` wrapper

**Decision:** In `ApplicationForm`, each control is nested inside its `<label>`
through a small `Field` component, rather than placing label and input as
siblings.

**Why:** Sibling labels without `htmlFor`/`id` are not programmatically
associated — screen readers can't name the field and `getByLabelText` fails.
Nesting fixes both accessibility and testability without manual id wiring. (This
was caught by a failing integration test — a real a11y bug, not just a test
issue.)

---

## D8 — `crypto.randomUUID()` instead of a `uuid` dependency

**Decision:** Generate IDs with the built-in `crypto.randomUUID()`.

**Why:** Available in the browser and in Node 20 / jsdom; removes a dependency.
