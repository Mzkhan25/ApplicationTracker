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

---

## D9 — Follow-up reminders are a per-stage window (stage gains a behavior)

**Decision:** Each `Stage` has an optional `followUpDays`. An application is due
for follow-up when its days-since-`updatedAt` exceeds *its stage's* window.
Unset = the stage never flags. Replaces the earlier single global 7-day
threshold.

**Why:** Different stages have different urgency — chase an "Interview" within
days, but "Applied" can sit for weeks — and terminal stages (Offer/Rejected)
shouldn't nag at all. A per-stage window expresses all of this naturally, and
"unset = off" silences terminal columns without special-casing names (stays
consistent with D2's no-hardcoded-stage-names rule).

**Note — relationship to D2:** This is the first time a stage carries *behavior*
(not just display). It does **not** reintroduce stage semantics by name — the
behavior is opt-in numeric config the user controls per column. Metrics in
`metrics.ts` remain semantic-free. If a future change wants win/loss conversion,
that's a separate decision (see D2's rejected alternative).

**Implementation:** `followUpDays?` on `Stage`; `staleApplications(apps, stages,
now)` in `followups.ts`; `setStageFollowUpDays` store action; column kebab menu
editor + header ⏰ badge.

**Alternatives rejected:** Keep the global threshold (can't express per-stage
urgency or silence terminal columns). Per-application reminder dates (a different
feature — a reminder on a *card*, not a *stage*; could be added later alongside
this).

---

## D10 — Pipeline view is a donut (proportion), built dependency-free

**Decision:** The "Pipeline breakdown" widget is a donut chart — each stage is a
slice sized by its share of total applications — built as hand-rolled SVG via the
pure `donutSegments` helper. It replaced the earlier funnel-bar widget.

**Why:** A donut is the canonical proportion-of-whole visualization, so it pairs
cleanly with StageCounts: **StageCounts = magnitude** (which column is biggest,
exact counts), **PipelineBreakdown = proportion** (each stage's share). The old
funnel bars were a near-duplicate of StageCounts and "funnel" was misleading —
the data was never a cumulative drop-off funnel (see D2).

**Why hand-rolled (no chart library):** A static donut is ~40 lines of SVG using
`stroke-dasharray` arcs; a library (recharts/chart.js) would add ~100–500 kB for
one chart and a new API surface. The codebase already hand-rolls all its SVGs.
Tradeoff: no built-in hover tooltips/animation (acceptable for this widget).

**Alternatives rejected:** Keep the funnel bars (redundant with StageCounts).
Add a chart library (heavy for one small static chart). A *true* cumulative
conversion funnel (needs stage win/lost semantics — blocked by D2).

---

## D11 — Money is euros; demanded salary is exact, the range is abbreviated

**Decision:** All money displays in euros (€) via `Intl.NumberFormat('en-IE',
{ currency: 'EUR' })`. The **demanded salary** is shown in full (`€185,000`,
no rounding). The posted **salary range** stays abbreviated to thousands
(`€120k–150k`).

**Why:** Per user request — euros, and don't round the demanded salary (it's the
specific number you're negotiating, so precision matters). The posted range is a
rough band where abbreviation aids scannability and the user didn't ask to change
it, so it stays compact — only the currency symbol changed there.

**Why `en-IE` locale:** Produces the `€` symbol as a prefix with comma grouping
(`€185,000`) and is deterministic across environments (doesn't depend on the
runtime's default locale), which keeps the unit tests stable.

**Note:** If consistency is later preferred, `formatSalary` can be switched to
exact euros too — it's a one-function change. Helpers live in
`src/utils/format.ts` (`formatMoney` exact, `formatSalary` range).

---

## D12 — GitHub Pages deployment: clean URLs + 404 redirect trick

**Decision:** Deployed as a GitHub Pages *project site* at
`https://mzkhan25.github.io/ApplicationTracker/`. Uses `BrowserRouter` (clean
URLs) not `HashRouter`, with the rafrex SPA-on-GitHub-Pages redirect technique
to survive hard refreshes on deep links.

**Why clean URLs over HashRouter:** Hash-based routing (`#/board`) is visually
noisy and breaks URL sharing expectations. The 404-redirect technique is a
well-established workaround (used by many SPAs on GitHub Pages) with negligible
complexity cost.

**Key pieces:**
1. `vite.config.ts` — `base: '/ApplicationTracker/'` on `build`, `'/'` on `dev`.
2. `src/main.tsx` — `basename={import.meta.env.BASE_URL.replace(/\/$/, '')}` so
   the router knows the subpath.
3. `public/404.html` — encodes the requested path into a query string
   (`?/board`), then redirects to `index.html`.
4. `index.html` — decodes the query string back to the real path via
   `window.history.replaceState` before React boots.
5. `.github/workflows/deploy.yml` — lint → test → build → upload artifact →
   deploy-pages; requires `pages: write` + `id-token: write` permissions.

**Alternatives rejected:** HashRouter (ugly URLs). Netlify/Vercel (not
requested; GitHub Pages is free and sufficient for a static SPA).
