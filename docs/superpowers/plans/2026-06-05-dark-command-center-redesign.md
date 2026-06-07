# Dark Command Center Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved "Dark Command Center" mockup — replacing the light slate theme with a deep navy design, swapping the hand-rolled SVG charts for ECharts (donut + horizontal bar), and updating every component to the new aesthetic.

**Architecture:** All changes are purely presentational; no data layer, store, services, or types are touched. The existing heading/semantic structure is preserved so all 26 passing tests continue to pass. `echarts` is added as a runtime dependency; the two chart widget components (`PipelineBreakdown`, `StageCounts`) are rewritten in place, keeping the same props interfaces. Everything else is a Tailwind class / CSS token swap.

**Tech Stack:** React 18 · TypeScript (strict) · Tailwind v4 CSS-first · `echarts` (direct, no wrapper package) · Google Fonts (Sora + Inter via CDN link in `index.html`).

---

## Files Modified

| File | Change |
|------|--------|
| `index.html` | Add Google Fonts `<link>` for Sora + Inter |
| `src/index.css` | Dark `@theme` tokens; dot-grid + atmospheric body background; custom scrollbar; font-family tokens |
| `src/components/layout/AppShell.tsx` | Dark header, gradient top accent, AT logo with cyan-violet gradient |
| `src/components/layout/NavBar.tsx` | Underline-style active state instead of pill |
| `src/components/common/Button.tsx` | Dark variant colour map |
| `src/components/common/Badge.tsx` | Dark default (no custom colour) style |
| `src/components/common/Modal.tsx` | Dark modal dialog background |
| `src/components/dashboard/Panel.tsx` | Dark card; keep `<section>` + `<h2>` (required by tests) |
| `src/components/dashboard/StatTiles.tsx` | Accent-bar stat tiles |
| `src/components/dashboard/PipelineBreakdown.tsx` | ECharts donut replacing hand-rolled SVG |
| `src/components/dashboard/StageCounts.tsx` | ECharts horizontal bar replacing progress bars |
| `src/components/dashboard/RecentActivity.tsx` | Avatar list style |
| `src/components/dashboard/FollowUpList.tsx` | Updated list style matching mockup |
| `src/pages/DashboardPage.tsx` | Page header + `flex-col gap` layout |
| `src/components/board/Card.tsx` | Dark card with priority left-stripe |
| `src/components/board/Column.tsx` | Dark column with coloured top bar; keep `<h3>` (required by tests) |
| `src/components/board/AddColumn.tsx` | Dark ghost button |
| `src/components/board/ApplicationForm.tsx` | Dark form inputs |
| `src/pages/BoardPage.tsx` | Dark page header |
| `src/pages/HelpPage.tsx` | Dark `Ui` / `Step` styles |
| `src/pages/DashboardPage.test.tsx` | Add `vi.mock('echarts')` so jsdom doesn't crash on canvas |

---

### Task 1: Infrastructure — fonts, echarts package, test mock

**Files:**
- Modify: `index.html`
- Modify: `src/pages/DashboardPage.test.tsx`
- Run: `npm install`

- [ ] **Step 1: Add Google Fonts to index.html**

Replace the existing `<head>` block (between `<link rel="icon"…>` and `</head>`) so it reads:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script type="text/javascript">
      (function (l) {
        if (l.search[1] === '/') {
          var decoded = l.search
            .slice(1)
            .split('&')
            .map(function (s) {
              return s.replace(/~and~/g, '&');
            })
            .join('?');
          window.history.replaceState(
            null,
            null,
            l.pathname.slice(0, -1) + decoded + l.hash,
          );
        }
      })(window.location);
    </script>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
      rel="stylesheet"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Application Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Install echarts**

```bash
npm install echarts
```

Expected: `echarts` appears in `package.json` `dependencies`.

- [ ] **Step 3: Add echarts mock to DashboardPage test**

`PipelineBreakdown` and `StageCounts` will call `echarts.init()` which needs canvas; jsdom provides a stub but ECharts throws. Add `vi.mock` at the top of the test file. The mock must come before any imports that transitively import echarts.

```ts
// src/pages/DashboardPage.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { useAppStore } from '../store/useAppStore';

vi.mock('echarts', () => ({
  init: vi.fn().mockReturnValue({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  }),
}));

describe('DashboardPage', () => {
  beforeEach(async () => {
    await useAppStore.getState().init();
  });

  it('renders all four widgets from seeded data', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    for (const title of [
      'Applications by stage',
      'Pipeline breakdown',
      'Recent activity',
      'Follow-up reminders',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('surfaces the stale seeded application as a follow-up', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    const followUps = screen
      .getByRole('heading', { name: 'Follow-up reminders' })
      .closest('section')!;
    expect(within(followUps).getByText('Globex')).toBeInTheDocument();
    expect(within(followUps).getByText('1 due')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run existing tests — verify they still pass**

```bash
npm test
```

Expected: 26 passing tests (no change yet — just confirming the baseline is green before touching components).

- [ ] **Step 5: Commit**

```bash
git add index.html src/pages/DashboardPage.test.tsx package.json package-lock.json
git commit -m "chore: add google fonts, install echarts, mock echarts in dashboard test"
```

---

### Task 2: CSS Theme Layer

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace index.css entirely**

```css
@import 'tailwindcss';

/*
  Design tokens. Tailwind v4 maps --color-* → bg-*, text-*, border-* utilities
  and --font-* → font-* utilities automatically.
*/
@theme {
  /* Brand accent → cyan (was blue) */
  --color-brand-50:  rgba(6,182,212,0.08);
  --color-brand-100: rgba(6,182,212,0.15);
  --color-brand-500: #06b6d4;
  --color-brand-600: #06b6d4;
  --color-brand-700: #0891b2;

  /* Dark surfaces */
  --color-surface:  #060d1c;
  --color-card:     #0c1528;
  --color-elevated: #111e36;

  /* Typography */
  --font-display: 'Sora', sans-serif;
}

html,
body,
#root {
  height: 100%;
}

body {
  @apply bg-surface text-slate-200 antialiased;
  /* atmospheric radial glow at top + subtle dot grid */
  background-image:
    radial-gradient(ellipse 900px 500px at 50% -80px, rgba(6,182,212,0.045), transparent),
    radial-gradient(circle at 1px 1px, rgba(148,163,184,0.045) 1px, transparent 0);
  background-size: auto, 28px 28px;
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.15); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.25); }
```

- [ ] **Step 2: Verify dev server starts without CSS errors**

```bash
npm run dev
```

Expected: Vite compiles; browser shows dark background. No CSS parse errors in the terminal.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: dark theme tokens and atmospheric body background"
```

---

### Task 3: App Shell — AppShell + NavBar

**Files:**
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/layout/NavBar.tsx`

- [ ] **Step 1: Rewrite AppShell**

```tsx
import type { ReactNode } from 'react';
import { NavBar } from './NavBar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-700/20 bg-surface/80 backdrop-blur-xl">
        {/* Gradient top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-60" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-[11px] font-extrabold text-white shadow-[0_0_16px_rgba(6,182,212,0.35)]">
              AT
            </span>
            <span className="font-display text-[15px] font-bold text-slate-100">
              Application Tracker
            </span>
          </div>
          <NavBar />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite NavBar**

```tsx
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/board', label: 'Board', end: false },
  { to: '/help', label: 'How to use', end: false },
];

export function NavBar() {
  return (
    <nav className="flex items-center gap-7">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `border-b-2 pb-1 pt-1 text-[13px] font-medium transition-colors ${
              isActive
                ? 'border-brand-500 text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Check in browser**

```bash
npm run dev
```

Expected: Dark sticky header with gradient top line, "AT" logo with glow, underline-style active nav link.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppShell.tsx src/components/layout/NavBar.tsx
git commit -m "style: dark app shell and underline nav"
```

---

### Task 4: Common Primitives — Button, Badge, Modal

**Files:**
- Modify: `src/components/common/Button.tsx`
- Modify: `src/components/common/Badge.tsx`
- Modify: `src/components/common/Modal.tsx`

- [ ] **Step 1: Rewrite Button**

```tsx
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-slate-950 font-semibold hover:bg-brand-500 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_24px_rgba(6,182,212,0.35)]',
  secondary:
    'bg-transparent text-brand-500 ring-1 ring-brand-500/40 hover:bg-brand-50',
  ghost: 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200',
  danger: 'bg-red-600/90 text-white hover:bg-red-600',
};

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-sm',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Rewrite Badge**

```tsx
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className = '' }: BadgeProps) {
  const style = color
    ? { backgroundColor: `${color}1a`, color, borderColor: `${color}33` }
    : undefined;
  return (
    <span
      style={style}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        color ? '' : 'border-slate-700/50 bg-slate-800 text-slate-400'
      } ${className}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Rewrite Modal**

```tsx
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 pt-[10vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-xl bg-card shadow-2xl ring-1 ring-slate-700/30"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-slate-700/30 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-slate-500 hover:bg-slate-700/50 hover:text-slate-200"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: 26 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/common/Button.tsx src/components/common/Badge.tsx src/components/common/Modal.tsx
git commit -m "style: dark button, badge, and modal primitives"
```

---

### Task 5: Dashboard Shell — Panel + StatTiles

**Files:**
- Modify: `src/components/dashboard/Panel.tsx`
- Modify: `src/components/dashboard/StatTiles.tsx`

- [ ] **Step 1: Rewrite Panel**

`<section>` and `<h2>` are required — `DashboardPage.test.tsx` queries `getByRole('heading', { name })` and `.closest('section')`.

```tsx
import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, action, children, className = '' }: PanelProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-700/20 bg-card ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-700/20 px-5 py-3.5">
        <h2 className="font-display text-[12px] font-semibold uppercase tracking-widest text-slate-500">
          {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
```

- [ ] **Step 2: Rewrite StatTiles**

Each tile has a coloured 2px accent bar along the bottom edge — achieved with a positioned div using an inline gradient.

```tsx
interface Tile {
  label: string;
  value: string;
  hint?: string;
  accent: string;
}

function Tile({ label, value, hint, accent }: Tile) {
  return (
    <div className="relative cursor-default overflow-hidden rounded-xl border border-slate-700/20 bg-card px-5 py-5 transition-all hover:-translate-y-px hover:border-slate-600/30">
      <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-500">
        {label}
      </p>
      <p
        className="mt-1.5 font-display text-[34px] font-extrabold leading-none"
        style={{ color: accent }}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-slate-600">{hint}</p>}
      {/* accent bar */}
      <div
        className="absolute inset-x-0 bottom-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
    </div>
  );
}

interface StatTilesProps {
  total: number;
  responseRate: number;
  companyCount: number;
  followUpCount: number;
}

export function StatTiles({
  total,
  responseRate,
  companyCount,
  followUpCount,
}: StatTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Tile label="Applications"   value={String(total)}                           accent="#3b82f6" />
      <Tile label="Response Rate"  value={`${Math.round(responseRate * 100)}%`}    accent="#8b5cf6" hint="moved past first stage" />
      <Tile label="Companies"      value={String(companyCount)}                    accent="#06b6d4" />
      <Tile label="Follow-ups Due" value={String(followUpCount)}                   accent="#f59e0b" hint="past stage reminder window" />
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: 26 passing.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/Panel.tsx src/components/dashboard/StatTiles.tsx
git commit -m "style: dark panel card and accent-bar stat tiles"
```

---

### Task 6: ECharts Charts — PipelineBreakdown + StageCounts

**Files:**
- Modify: `src/components/dashboard/PipelineBreakdown.tsx`
- Modify: `src/components/dashboard/StageCounts.tsx`

Note: `src/utils/donut.ts` and `src/utils/donut.test.ts` are **not** modified — the pure helper remains tested even though it is no longer used by a component.

- [ ] **Step 1: Rewrite PipelineBreakdown with ECharts donut**

```tsx
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { PipelineSummary } from '../../services/metrics';
import { Panel } from './Panel';

export function PipelineBreakdown({ summary }: { summary: PipelineSummary }) {
  const { funnel, total } = summary;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = echarts.init(containerRef.current);

    const data = funnel
      .filter((f) => f.count > 0)
      .map((f) => ({
        name: f.stage.name,
        value: f.count,
        itemStyle: {
          color: f.stage.color,
          shadowBlur: 14,
          shadowColor: `${f.stage.color}55`,
        },
      }));

    chartRef.current.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        confine: true,
        position(
          point: number[],
          _p: unknown,
          _el: unknown,
          _r: unknown,
          size: { contentSize: number[]; viewSize: number[] },
        ) {
          const [x, y] = point;
          const [cw] = size.viewSize;
          const left =
            x + size.contentSize[0] + 20 < cw
              ? x + 14
              : x - size.contentSize[0] - 14;
          return [left, y - 20];
        },
        backgroundColor: '#0c1528',
        borderColor: 'rgba(148,163,184,0.14)',
        textStyle: { color: '#e2e8f0', fontFamily: 'Inter', fontSize: 12 },
        formatter: '{b}: <b>{c}</b> ({d}%)',
        extraCssText: 'border-radius:8px;padding:10px 14px;',
      },
      series: [
        {
          type: 'pie',
          radius: ['52%', '72%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: { borderRadius: 3, borderWidth: 2, borderColor: 'transparent' },
          emphasis: { scale: true, scaleSize: 5, itemStyle: { shadowBlur: 20 } },
          data,
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: String(total),
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 800,
            fontFamily: 'Sora',
            fill: '#e2e8f0',
            y: 5,
          },
        },
      ],
    });

    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      chartRef.current?.dispose();
      window.removeEventListener('resize', onResize);
    };
  }, [funnel, total]);

  const activeFunnel = funnel.filter((f) => f.count > 0);

  return (
    <Panel title="Pipeline breakdown">
      {total === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No applications yet.</p>
      ) : (
        <div className="flex items-center gap-5">
          <div ref={containerRef} style={{ width: 160, height: 160, flexShrink: 0 }} />
          <ul className="flex-1 space-y-2.5">
            {activeFunnel.map(({ stage, count }) => (
              <li key={stage.id} className="flex items-center gap-2.5 text-xs">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: stage.color,
                    boxShadow: `0 0 6px ${stage.color}80`,
                  }}
                />
                <span className="flex-1 truncate text-slate-400">{stage.name}</span>
                <span className="font-bold text-slate-200">{count}</span>
                <span className="w-9 text-right text-slate-500">
                  {Math.round((count / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
```

- [ ] **Step 2: Rewrite StageCounts with ECharts horizontal bar**

```tsx
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { StageCount } from '../../services/metrics';
import { Panel } from './Panel';

export function StageCounts({ counts }: { counts: StageCount[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = echarts.init(containerRef.current);

    // Reverse so the first stage sits at the top of the chart.
    const reversed = [...counts].reverse();

    chartRef.current.setOption({
      backgroundColor: 'transparent',
      grid: { left: 12, right: 24, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'none' },
        backgroundColor: '#0c1528',
        borderColor: 'rgba(148,163,184,0.14)',
        textStyle: { color: '#e2e8f0', fontFamily: 'Inter', fontSize: 12 },
        extraCssText: 'border-radius:8px;padding:10px 14px;',
      },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#2d3f58',
          fontSize: 11,
          fontFamily: 'Inter',
          formatter: (v: number) => (Number.isInteger(v) ? String(v) : ''),
        },
        splitLine: {
          lineStyle: { color: 'rgba(148,163,184,0.05)', type: 'dashed' as const },
        },
      },
      yAxis: {
        type: 'category',
        data: reversed.map((c) => c.stage.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 12, fontFamily: 'Inter' },
      },
      series: [
        {
          type: 'bar',
          barWidth: 12,
          data: reversed.map((c) => ({
            value: c.count,
            itemStyle: {
              color: c.stage.color,
              borderRadius: [0, 4, 4, 0],
              shadowBlur: 10,
              shadowColor: `${c.stage.color}44`,
            },
          })),
          emphasis: { itemStyle: { shadowBlur: 18 } },
          label: {
            show: true,
            position: 'right' as const,
            color: '#4b5e78',
            fontFamily: 'Inter',
            fontSize: 11,
            formatter: (params: { value: number | string }) =>
              params.value === 0 ? '' : String(params.value),
          },
        },
      ],
    });

    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      chartRef.current?.dispose();
      window.removeEventListener('resize', onResize);
    };
  }, [counts]);

  return (
    <Panel title="Applications by stage">
      <div ref={containerRef} style={{ width: '100%', height: 190 }} />
    </Panel>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: 26 passing. The ECharts mock returns stub functions so `echarts.init()` doesn't crash jsdom.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/PipelineBreakdown.tsx src/components/dashboard/StageCounts.tsx
git commit -m "feat: replace SVG charts with ECharts donut and horizontal bar"
```

---

### Task 7: Dashboard Lists — RecentActivity + FollowUpList

**Files:**
- Modify: `src/components/dashboard/RecentActivity.tsx`
- Modify: `src/components/dashboard/FollowUpList.tsx`

- [ ] **Step 1: Rewrite RecentActivity**

```tsx
import type { Application, Stage } from '../../types';
import { Badge } from '../common/Badge';
import { relativeDay } from '../../utils/format';
import { Panel } from './Panel';

interface RecentActivityProps {
  items: Application[];
  stageById: Map<string, Stage>;
}

export function RecentActivity({ items, stageById }: RecentActivityProps) {
  return (
    <Panel title="Recent activity">
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-slate-700/20">
          {items.map((app) => {
            const stage = stageById.get(app.stageId);
            return (
              <li key={app.id} className="flex items-center gap-3 py-3">
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold"
                  style={{
                    background: stage ? `${stage.color}20` : 'rgba(148,163,184,0.08)',
                    color: stage ? stage.color : '#94a3b8',
                  }}
                >
                  {app.company[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[13px] font-semibold text-slate-100">
                    {app.company}
                  </p>
                  <p className="truncate text-xs text-slate-500">{app.role}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {stage && <Badge color={stage.color}>{stage.name}</Badge>}
                  <span className="text-[11px] text-slate-600">
                    {relativeDay(app.updatedAt)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
```

- [ ] **Step 2: Rewrite FollowUpList**

The `action` prop (`<Badge>{items.length} due</Badge>`) is passed to Panel and renders inside the `<section>` — required by `DashboardPage.test.tsx` (`within(followUps).getByText('1 due')`).

```tsx
import type { Application, Stage } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { relativeDay } from '../../utils/format';
import { Panel } from './Panel';

interface FollowUpListProps {
  items: Application[];
  stageById: Map<string, Stage>;
  onMarkFollowedUp: (id: string) => void;
}

export function FollowUpList({
  items,
  stageById,
  onMarkFollowedUp,
}: FollowUpListProps) {
  return (
    <Panel
      title="Follow-up reminders"
      action={
        items.length > 0 ? (
          <Badge color="#f59e0b">{items.length} due</Badge>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          You're all caught up. 🎉
        </p>
      ) : (
        <ul className="divide-y divide-slate-700/20">
          {items.map((app) => {
            const stage = stageById.get(app.stageId);
            return (
              <li key={app.id} className="flex items-center gap-3 py-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-sm">
                  ⏰
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[13px] font-semibold text-slate-100">
                    {app.company}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {app.role}
                    {stage && (
                      <>
                        {' · '}
                        <span style={{ color: stage.color }}>{stage.name}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-xs font-bold text-amber-500">
                    {relativeDay(app.updatedAt)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="border border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                    onClick={() => onMarkFollowedUp(app.id)}
                  >
                    Done
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: 26 passing. The `'1 due'` badge text is still inside the `<section>` via Panel's `action` prop.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/RecentActivity.tsx src/components/dashboard/FollowUpList.tsx
git commit -m "style: dark recent activity and follow-up lists with avatar style"
```

---

### Task 8: DashboardPage Layout

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Rewrite DashboardPage**

```tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { pipelineSummary, stageCounts } from '../services/metrics';
import { staleApplications } from '../services/followups';
import { recentApplications } from '../services/activity';
import { StatTiles } from '../components/dashboard/StatTiles';
import { StageCounts } from '../components/dashboard/StageCounts';
import { PipelineBreakdown } from '../components/dashboard/PipelineBreakdown';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { FollowUpList } from '../components/dashboard/FollowUpList';

export default function DashboardPage() {
  const stages = useAppStore((s) => s.stages);
  const applications = useAppStore((s) => s.applications);
  const updateApplication = useAppStore((s) => s.updateApplication);

  const view = useMemo(() => {
    const data = { stages, applications };
    return {
      summary: pipelineSummary(data),
      counts: stageCounts(data),
      recent: recentApplications(applications, 6),
      followUps: staleApplications(applications, stages),
      stageById: new Map(stages.map((s) => [s.id, s])),
      companyCount: new Set(applications.map((a) => a.company)).size,
    };
  }, [stages, applications]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[22px] font-extrabold text-slate-100">
            Dashboard
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Overview of your job search pipeline
          </p>
        </div>
        <Link
          to="/board"
          className="inline-flex items-center gap-1 rounded-lg border border-brand-500/35 px-4 py-2 text-[13px] font-semibold text-brand-500 transition-all hover:bg-brand-50 hover:shadow-[0_0_14px_rgba(6,182,212,0.25)]"
        >
          Open board →
        </Link>
      </div>

      <StatTiles
        total={view.summary.total}
        responseRate={view.summary.responseRate}
        companyCount={view.companyCount}
        followUpCount={view.followUps.length}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineBreakdown summary={view.summary} />
        <StageCounts counts={view.counts} />
        <RecentActivity items={view.recent} stageById={view.stageById} />
        <FollowUpList
          items={view.followUps}
          stageById={view.stageById}
          onMarkFollowedUp={(id) => updateApplication(id, {})}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: 26 passing.

- [ ] **Step 3: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "style: dashboard page header and flex-col gap layout"
```

---

### Task 9: Board Components — Card + Column + AddColumn + ApplicationForm

**Files:**
- Modify: `src/components/board/Card.tsx`
- Modify: `src/components/board/Column.tsx`
- Modify: `src/components/board/AddColumn.tsx`
- Modify: `src/components/board/ApplicationForm.tsx`

- [ ] **Step 1: Rewrite Card**

Priority is indicated by a coloured left-stripe instead of a badge. `PriorityTag` is no longer imported (it remains in the codebase — just unused by Card after this change).

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Application } from '../../types';
import { Badge } from '../common/Badge';
import { formatMoney, formatSalary, formatShortDate, workModeLabel } from '../../utils/format';

const PRIORITY_COLOR: Record<string, string> = {
  high:   '#f87171',
  medium: '#fbbf24',
  low:    '#64748b',
};

interface CardProps {
  application: Application;
  onClick: () => void;
  overlay?: boolean;
}

export function Card({ application, onClick, overlay = false }: CardProps) {
  const sortable = useSortable({ id: application.id });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    sortable;

  const style = overlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      };

  const salary = formatSalary(application.salaryMin, application.salaryMax);
  const mode = workModeLabel(application.workMode);
  const demanded =
    application.demandedSalary != null
      ? formatMoney(application.demandedSalary)
      : null;

  const stripeColor = PRIORITY_COLOR[application.priority] ?? '#64748b';

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-lg border border-slate-700/20 bg-elevated pl-4 pr-3 py-3 transition-all ${
        overlay
          ? 'rotate-2 shadow-xl'
          : 'hover:border-slate-600/40 hover:-translate-y-px hover:shadow-lg'
      }`}
    >
      {/* Priority left stripe */}
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: stripeColor,
          boxShadow: `0 0 8px ${stripeColor}55`,
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onClick}
          className="min-w-0 flex-1 text-left"
          aria-label={`Edit ${application.company} – ${application.role}`}
        >
          <p className="truncate font-display text-[13px] font-bold text-slate-100">
            {application.company}
          </p>
          <p className="truncate text-xs text-slate-400">{application.role}</p>
        </button>
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag card"
          className="-mr-1 cursor-grab touch-none rounded p-1 text-slate-600 hover:text-slate-400 active:cursor-grabbing"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="7" cy="5" r="1.5" />
            <circle cx="13" cy="5" r="1.5" />
            <circle cx="7" cy="10" r="1.5" />
            <circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="15" r="1.5" />
            <circle cx="13" cy="15" r="1.5" />
          </svg>
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {mode && <Badge>{mode}</Badge>}
        {salary && <Badge>{salary}</Badge>}
        {demanded && (
          <Badge color="#06b6d4" className="font-semibold">
            Asking {demanded}
          </Badge>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
        <span>Applied {formatShortDate(application.appliedDate)}</span>
        {application.location && (
          <span className="truncate pl-2">{application.location}</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite Column**

Keep `<h3>` for the stage name — `BoardPage.test.tsx` uses `getByRole('heading', { name: 'Applied' })` etc.

```tsx
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Application, Stage } from '../../types';
import { Card } from './Card';

interface ColumnProps {
  stage: Stage;
  applications: Application[];
  isFirst: boolean;
  isLast: boolean;
  canDelete: boolean;
  onAddCard: (stageId: string) => void;
  onEditCard: (application: Application) => void;
  onRename: (stageId: string, name: string) => void;
  onSetFollowUp: (stageId: string, days?: number) => void;
  onDelete: (stageId: string) => void;
  onMoveLeft: (stageId: string) => void;
  onMoveRight: (stageId: string) => void;
}

export function Column({
  stage,
  applications,
  isFirst,
  isLast,
  canDelete,
  onAddCard,
  onEditCard,
  onRename,
  onSetFollowUp,
  onDelete,
  onMoveLeft,
  onMoveRight,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(stage.name);
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState(
    stage.followUpDays?.toString() ?? '',
  );

  const commitRename = () => {
    onRename(stage.id, draftName);
    setRenaming(false);
  };

  const commitFollowUp = () => {
    const trimmed = followUpDraft.trim();
    const days = trimmed === '' ? undefined : Math.max(1, Number(trimmed));
    onSetFollowUp(stage.id, Number.isNaN(days) ? undefined : days);
    setEditingFollowUp(false);
  };

  const menuAction = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-700/20 bg-card">
      {/* Coloured top bar */}
      <div
        className="h-[3px]"
        style={{
          background: stage.color,
          boxShadow: `0 0 12px ${stage.color}55`,
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor: stage.color,
            boxShadow: `0 0 6px ${stage.color}80`,
          }}
        />
        {renaming ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setDraftName(stage.name);
                setRenaming(false);
              }
            }}
            className="min-w-0 flex-1 rounded border border-slate-600/50 bg-elevated px-1.5 py-0.5 text-sm font-semibold text-slate-100 focus:border-brand-500 focus:outline-none"
          />
        ) : (
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-300">
            {stage.name}
          </h3>
        )}

        {stage.followUpDays != null && (
          <span
            title={`Follow-up reminder after ${stage.followUpDays} days of inactivity`}
            className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 text-[10px] font-semibold text-amber-400"
          >
            <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.75 4a.75.75 0 0 0-1.5 0v4c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06L10.75 9.69V6Z" />
            </svg>
            {stage.followUpDays}d
          </span>
        )}
        <span className="rounded-full bg-slate-700/40 px-1.5 text-xs font-medium text-slate-500">
          {applications.length}
        </span>

        {/* Kebab menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={`${stage.name} column options`}
            className="rounded p-1 text-slate-600 hover:bg-slate-700/40 hover:text-slate-300"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-700/40 bg-card py-1 text-sm shadow-xl">
                <MenuItem onClick={menuAction(() => setRenaming(true))}>Rename</MenuItem>
                <MenuItem
                  onClick={menuAction(() => {
                    setFollowUpDraft(stage.followUpDays?.toString() ?? '');
                    setEditingFollowUp(true);
                  })}
                >
                  Follow-up reminder…
                </MenuItem>
                <MenuItem
                  disabled={isFirst}
                  onClick={menuAction(() => onMoveLeft(stage.id))}
                >
                  Move left
                </MenuItem>
                <MenuItem
                  disabled={isLast}
                  onClick={menuAction(() => onMoveRight(stage.id))}
                >
                  Move right
                </MenuItem>
                <MenuItem
                  disabled={!canDelete}
                  danger
                  onClick={menuAction(() => onDelete(stage.id))}
                >
                  Delete
                </MenuItem>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Follow-up editor */}
      {editingFollowUp && (
        <div className="mx-2 mb-2 rounded-lg border border-slate-700/30 bg-elevated p-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Remind after (days of inactivity)
          </label>
          <input
            autoFocus
            type="number"
            min={1}
            value={followUpDraft}
            onChange={(e) => setFollowUpDraft(e.target.value)}
            onBlur={commitFollowUp}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitFollowUp();
              if (e.key === 'Escape') setEditingFollowUp(false);
            }}
            placeholder="blank = off"
            className="w-full rounded border border-slate-600/50 bg-card px-2 py-1 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
          />
        </div>
      )}

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 rounded-lg px-2 pb-2 transition-colors ${
          isOver ? 'bg-brand-100/5' : ''
        }`}
      >
        <SortableContext
          items={applications.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((app) => (
            <Card key={app.id} application={app} onClick={() => onEditCard(app)} />
          ))}
        </SortableContext>

        {applications.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-slate-600">
            No applications
          </p>
        )}

        <button
          onClick={() => onAddCard(stage.id)}
          className="mt-1 rounded-md border border-dashed border-slate-700/25 px-2 py-1.5 text-left text-xs font-medium text-slate-600 transition-all hover:border-brand-500/40 hover:bg-brand-50/5 hover:text-brand-500"
        >
          + Add application
        </button>
      </div>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`block w-full px-3 py-1.5 text-left transition-colors hover:bg-slate-700/30 disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? 'text-red-400' : 'text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Rewrite AddColumn**

```tsx
import { useState } from 'react';

export function AddColumn({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed);
    setName('');
    setAdding(false);
  };

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex h-10 w-56 shrink-0 items-center gap-1 rounded-xl border border-dashed border-slate-700/30 px-3 text-sm font-medium text-slate-600 transition-all hover:border-brand-500/40 hover:bg-brand-50/5 hover:text-brand-500"
      >
        + Add column
      </button>
    );
  }

  return (
    <div className="w-56 shrink-0 rounded-xl border border-slate-700/30 bg-card p-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') {
            setName('');
            setAdding(false);
          }
        }}
        placeholder="Column name"
        className="w-full rounded border border-slate-600/50 bg-elevated px-2 py-1 text-sm font-semibold text-slate-100 focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}
```

- [ ] **Step 4: Rewrite ApplicationForm dark inputs**

```tsx
import { useState, type FormEvent, type ReactNode } from 'react';
import type { Application, Priority, Stage, WorkMode } from '../../types';
import type { ApplicationInput } from '../../store/useAppStore';
import { Button } from '../common/Button';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

interface ApplicationFormProps {
  stages: Stage[];
  defaultStageId?: string;
  initial?: Application;
  onSubmit: (input: ApplicationInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const inputClass =
  'w-full rounded-md border border-slate-600/50 bg-elevated px-3 py-1.5 text-sm text-slate-200 shadow-sm placeholder:text-slate-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1';

const todayISO = (): string => new Date().toISOString().slice(0, 10);
const numOrUndef = (v: string): number | undefined =>
  v.trim() === '' ? undefined : Number(v);
const trimOrUndef = (v: string): string | undefined =>
  v.trim() === '' ? undefined : v.trim();

export function ApplicationForm({
  stages,
  defaultStageId,
  initial,
  onSubmit,
  onCancel,
  onDelete,
}: ApplicationFormProps) {
  const [company, setCompany] = useState(initial?.company ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [stageId, setStageId] = useState(
    initial?.stageId ?? defaultStageId ?? stages[0]?.id ?? '',
  );
  const [appliedDate, setAppliedDate] = useState(
    initial?.appliedDate ?? todayISO(),
  );
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? 'medium',
  );
  const [workMode, setWorkMode] = useState<WorkMode | ''>(
    initial?.workMode ?? '',
  );
  const [location, setLocation] = useState(initial?.location ?? '');
  const [jobUrl, setJobUrl] = useState(initial?.jobUrl ?? '');
  const [salaryMin, setSalaryMin] = useState(
    initial?.salaryMin?.toString() ?? '',
  );
  const [salaryMax, setSalaryMax] = useState(
    initial?.salaryMax?.toString() ?? '',
  );
  const [demandedSalary, setDemandedSalary] = useState(
    initial?.demandedSalary?.toString() ?? '',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    onSubmit({
      company: company.trim(),
      role: role.trim(),
      stageId,
      appliedDate,
      priority,
      workMode: workMode === '' ? undefined : workMode,
      location: trimOrUndef(location),
      jobUrl: trimOrUndef(jobUrl),
      salaryMin: numOrUndef(salaryMin),
      salaryMax: numOrUndef(salaryMax),
      demandedSalary: numOrUndef(demandedSalary),
      notes: trimOrUndef(notes),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company *">
          <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} autoFocus required />
        </Field>
        <Field label="Role *">
          <input className={inputClass} value={role} onChange={(e) => setRole(e.target.value)} required />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Stage">
          <select className={inputClass} value={stageId} onChange={(e) => setStageId(e.target.value)}>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Applied date">
          <input type="date" className={inputClass} value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
        </Field>
        <Field label="Priority">
          <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Work mode">
          <select className={inputClass} value={workMode} onChange={(e) => setWorkMode(e.target.value as WorkMode | '')}>
            <option value="">—</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </Field>
        <Field label="Location">
          <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
        </Field>
      </div>

      <Field label="Job posting URL">
        <input type="url" className={inputClass} value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://…" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Salary min">
          <input type="number" className={inputClass} value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="120000" />
        </Field>
        <Field label="Salary max">
          <input type="number" className={inputClass} value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="150000" />
        </Field>
      </div>

      <Field label="Demanded salary (your ask)">
        <input type="number" className={inputClass} value={demandedSalary} onChange={(e) => setDemandedSalary(e.target.value)} placeholder="130000" />
      </Field>

      <Field label="Notes">
        <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Interview details, contacts, follow-ups…" />
      </Field>

      <div className="flex items-center justify-between pt-1">
        {onDelete ? (
          <Button type="button" variant="danger" size="sm" onClick={onDelete}>Delete</Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit">{initial ? 'Save' : 'Add application'}</Button>
        </div>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: 26 passing. Board tests look for `h3` headings by name (Applied, Phone Screen, Interview, Offer) and card text (Acme Corp, Asking €185,000) — all still present.

- [ ] **Step 6: Commit**

```bash
git add src/components/board/Card.tsx src/components/board/Column.tsx src/components/board/AddColumn.tsx src/components/board/ApplicationForm.tsx
git commit -m "style: dark board cards, columns, form inputs"
```

---

### Task 10: Pages — BoardPage + HelpPage

**Files:**
- Modify: `src/pages/BoardPage.tsx`
- Modify: `src/pages/HelpPage.tsx`

- [ ] **Step 1: Rewrite BoardPage**

```tsx
import { useState } from 'react';
import type { Application } from '../types';
import { useAppStore, type ApplicationInput } from '../store/useAppStore';
import { Board } from '../components/board/Board';
import { ApplicationForm } from '../components/board/ApplicationForm';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

type Editing =
  | { mode: 'add'; stageId?: string }
  | { mode: 'edit'; application: Application }
  | null;

export default function BoardPage() {
  const stages = useAppStore((s) => s.stages);
  const addApplication = useAppStore((s) => s.addApplication);
  const updateApplication = useAppStore((s) => s.updateApplication);
  const deleteApplication = useAppStore((s) => s.deleteApplication);

  const [editing, setEditing] = useState<Editing>(null);

  const handleSubmit = (input: ApplicationInput) => {
    if (editing?.mode === 'edit') {
      updateApplication(editing.application.id, input);
    } else {
      addApplication(input);
    }
    setEditing(null);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[22px] font-extrabold text-slate-100">
            Pipeline
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Drag cards between columns to update their status.
          </p>
        </div>
        <Button onClick={() => setEditing({ mode: 'add' })}>
          + New application
        </Button>
      </div>

      <Board
        onAddCard={(stageId) => setEditing({ mode: 'add', stageId })}
        onEditCard={(application) => setEditing({ mode: 'edit', application })}
      />

      <Modal
        open={editing !== null}
        title={editing?.mode === 'edit' ? 'Edit application' : 'New application'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <ApplicationForm
            stages={stages}
            defaultStageId={editing.mode === 'add' ? editing.stageId : undefined}
            initial={editing.mode === 'edit' ? editing.application : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
            onDelete={
              editing.mode === 'edit'
                ? () => {
                    deleteApplication(editing.application.id);
                    setEditing(null);
                  }
                : undefined
            }
          />
        )}
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite HelpPage**

```tsx
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../components/dashboard/Panel';

function Ui({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-elevated px-1.5 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-slate-600/50">
      {children}
    </span>
  );
}

function Step({ children }: { children: ReactNode }) {
  return <li className="leading-relaxed text-slate-400">{children}</li>;
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-[22px] font-extrabold text-slate-100">
          How to use
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything this app can do, and how to do it. Track where you applied,
          the role, and how far each application has progressed.
        </p>
      </div>

      <Panel title="The basics">
        <div className="space-y-3 text-sm">
          <p className="text-slate-400">
            The app has two main views, switchable from the top navigation:
          </p>
          <ul className="space-y-2">
            <Step>
              <strong className="text-slate-200">Board</strong> — a Jira-style
              Kanban board. Each application is a card; each column is a status
              stage. This is where you add applications and move them along.
            </Step>
            <Step>
              <strong className="text-slate-200">Dashboard</strong> — an overview
              of your pipeline: totals, distribution across stages, recent
              activity, and follow-up reminders.
            </Step>
          </ul>
          <p className="text-slate-400">
            On first run the app is pre-filled with a few sample applications so
            nothing looks empty — feel free to edit or delete them.
          </p>
        </div>
      </Panel>

      <Panel title="Adding &amp; editing applications">
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="mb-1 font-semibold text-slate-200">Add an application</h3>
            <ul className="ml-4 list-disc space-y-1.5">
              <Step>
                Click <Ui>+ New application</Ui> at the top of the{' '}
                <Link to="/board" className="text-brand-500 hover:underline">Board</Link>,
                or <Ui>+ Add application</Ui> at the bottom of a specific column to start it in that stage.
              </Step>
              <Step>
                Fill in the form. <strong className="text-slate-200">Company</strong> and{' '}
                <strong className="text-slate-200">Role</strong> are required; everything else is optional.
              </Step>
              <Step>
                Click <Ui>Add application</Ui> — the card appears in its column and the dashboard updates immediately.
              </Step>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-slate-200">Fields on a card</h3>
            <p className="mb-1 text-slate-500">All amounts are shown in euros (€).</p>
            <ul className="ml-4 list-disc space-y-1.5">
              <Step><strong className="text-slate-200">Company / Role</strong> — shown on the card face (required).</Step>
              <Step><strong className="text-slate-200">Stage</strong> — which column the card lives in (its status).</Step>
              <Step><strong className="text-slate-200">Applied date</strong> — defaults to today; shown as "Applied Jun 4" on the card.</Step>
              <Step><strong className="text-slate-200">Priority</strong> — High, Medium, or Low, shown as a coloured left stripe on the card.</Step>
              <Step><strong className="text-slate-200">Work mode</strong> — Remote, Hybrid, or Onsite (optional).</Step>
              <Step><strong className="text-slate-200">Location</strong>, <strong className="text-slate-200">Job posting URL</strong>, and <strong className="text-slate-200">Salary min/max</strong> — the role's posted range (e.g. "€120k–150k").</Step>
              <Step>
                <strong className="text-slate-200">Demanded salary</strong> — the salary you're asking for (shown exactly, not rounded).
                Appears prominently on the card as a badge like "Asking €130,000", separate from the posted range.
              </Step>
              <Step><strong className="text-slate-200">Notes</strong> — free text for interview details, contacts, follow-ups (optional).</Step>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 font-semibold text-slate-200">Edit or delete</h3>
            <ul className="ml-4 list-disc space-y-1.5">
              <Step><strong className="text-slate-200">Edit:</strong> click anywhere on a card's body to open it, change fields, then <Ui>Save</Ui>.</Step>
              <Step><strong className="text-slate-200">Delete:</strong> open the card and click <Ui>Delete</Ui> (bottom-left of the dialog).</Step>
            </ul>
          </div>
        </div>
      </Panel>

      <Panel title="Moving applications between stages">
        <div className="space-y-3 text-sm">
          <p className="text-slate-400">Changing an application's status means moving its card to another column.</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <Step>
              <strong className="text-slate-200">Drag &amp; drop:</strong> grab the dotted grip handle on the right of a card and drag it to another column, or to a new position within the same column. The status updates and is saved automatically.
            </Step>
            <Step>
              <strong className="text-slate-200">Keyboard:</strong> Tab to a card's grip handle, press <Ui>Space</Ui> to pick it up, use the arrow keys to move, and <Ui>Space</Ui> again to drop.
            </Step>
            <Step>You can also change the stage from the edit dialog using the <strong className="text-slate-200">Stage</strong> dropdown.</Step>
          </ul>
        </div>
      </Panel>

      <Panel title="Customizing the pipeline (columns)">
        <div className="space-y-3 text-sm">
          <p className="text-slate-400">
            Columns are your status stages. Defaults are{' '}
            <em>Applied → Phone Screen → Interview → Offer → Rejected</em>, but you can change them freely.
            Open a column's <Ui>⋮</Ui> menu (top-right of the column) for these actions:
          </p>
          <ul className="ml-4 list-disc space-y-1.5">
            <Step><strong className="text-slate-200">Add a column:</strong> click <Ui>+ Add column</Ui> at the far right of the board and type a name.</Step>
            <Step><strong className="text-slate-200">Rename:</strong> <Ui>⋮</Ui> → <Ui>Rename</Ui>, edit the name inline, press Enter.</Step>
            <Step><strong className="text-slate-200">Reorder:</strong> <Ui>⋮</Ui> → <Ui>Move left</Ui> / <Ui>Move right</Ui>.</Step>
            <Step><strong className="text-slate-200">Delete:</strong> <Ui>⋮</Ui> → <Ui>Delete</Ui>. Any cards in that column are moved to the first column so nothing is lost. You can't delete the last remaining column.</Step>
          </ul>
        </div>
      </Panel>

      <Panel title="Follow-up reminders">
        <div className="space-y-3 text-sm">
          <p className="text-slate-400">Each column can flag applications that have gone too long without an update, so you know when to follow up.</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <Step>
              <strong className="text-slate-200">Set a window:</strong> column <Ui>⋮</Ui> → <Ui>Follow-up reminder…</Ui>, then enter a number of days.
              A small ⏰ badge appears in the column header showing the window. Leave the field blank to turn reminders off for that column.
            </Step>
            <Step>
              <strong className="text-slate-200">How flagging works:</strong> an application is "due" when the days since its last change exceed its column's window.
              Defaults: Applied 14 days, Phone Screen 7, Interview 5; Offer and Rejected have no reminders (they're terminal stages).
            </Step>
            <Step><strong className="text-slate-200">Where they show:</strong> the Dashboard's <em>Follow-up reminders</em> panel lists everything due, most overdue first.</Step>
            <Step>
              <strong className="text-slate-200">Clearing one:</strong> click <Ui>Done</Ui> next to a reminder — this marks the application as just-updated, resetting its timer (it doesn't change the stage).
            </Step>
          </ul>
        </div>
      </Panel>

      <Panel title="Reading the dashboard">
        <div className="space-y-3 text-sm">
          <ul className="ml-4 list-disc space-y-1.5">
            <Step><strong className="text-slate-200">Stat tiles:</strong> <em>Applications</em> (total), <em>Response rate</em> (share that moved past the first stage), <em>Companies</em> (distinct employers), and <em>Follow-ups due</em>.</Step>
            <Step><strong className="text-slate-200">Applications by stage:</strong> a horizontal bar chart showing how many cards are in each column.</Step>
            <Step><strong className="text-slate-200">Pipeline breakdown:</strong> a donut chart showing each stage's <em>share</em> of all applications, with the total in the centre.</Step>
            <Step><strong className="text-slate-200">Recent activity:</strong> the applications you changed most recently.</Step>
            <Step><strong className="text-slate-200">Follow-up reminders:</strong> applications past their stage's reminder window (see above).</Step>
          </ul>
        </div>
      </Panel>

      <Panel title="Your data &amp; privacy">
        <div className="space-y-3 text-sm">
          <ul className="ml-4 list-disc space-y-1.5">
            <Step>All data is stored <strong className="text-slate-200">locally in your browser</strong> (no account, no server). Nothing leaves your device.</Step>
            <Step>Because it's per-browser, your data <strong className="text-slate-200">won't sync</strong> across devices or browsers, and clearing your browser's site data for this app will erase it.</Step>
            <Step>Every change is saved automatically — there's no "save" button for the board as a whole.</Step>
          </ul>
        </div>
      </Panel>

      <p className="pb-2 text-center text-xs text-slate-600">
        Ready to start? Head to the{' '}
        <Link to="/board" className="text-brand-500 hover:underline">Board</Link>
        {' '}or the{' '}
        <Link to="/" className="text-brand-500 hover:underline">Dashboard</Link>.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: 26 passing.

- [ ] **Step 4: Commit**

```bash
git add src/pages/BoardPage.tsx src/pages/HelpPage.tsx
git commit -m "style: dark board page and help page"
```

---

### Task 11: Verify quality gates + update docs

**Files:**
- Modify: `docs/STATUS.md`
- Modify: `docs/CHANGELOG.md`
- Modify: `docs/ARCHITECTURE.md`

- [ ] **Step 1: Run full quality gate**

```bash
npm run lint && npm run build && npm test
```

Expected output:
- `lint`: 0 problems
- `build`: `tsc -b` succeeds; Vite produces assets
- `test`: 26 passing tests

Fix any TypeScript errors before proceeding (ECharts option types may require `as const` on a few string literals — add them if tsc flags them).

- [ ] **Step 2: Smoke-test in browser**

```bash
npm run dev
```

Manually verify:
1. Dashboard loads with dark background, four stat tiles with accent bars, ECharts donut and bar charts animate in.
2. Follow-up reminder "Done" button still works (Globex disappears from the list).
3. Board shows dark columns with coloured top bars and priority-striped cards.
4. Modal (add/edit card) has dark background and dark inputs.
5. Help page renders in dark theme.
6. Nav underline highlights the active route.

- [ ] **Step 3: Update STATUS.md**

Add to the "Completed" list:

```markdown
- [x] **Dark "Command Center" redesign** (2026-06-05) — full visual overhaul to a
      deep-navy theme (surface #060d1c, card #0c1528). Google Fonts (Sora + Inter).
      ECharts replaces hand-rolled SVG donut and progress-bar stage counts.
      Priority shown as a coloured left-stripe on board cards.
      All 26 tests pass; lint and build green. See `DECISIONS.md` D13.
```

Update the "Last updated" date to `2026-06-05` and "Dashboard charts" entry in the dashboard bullet.

- [ ] **Step 4: Add CHANGELOG.md entry**

Add at the top of `docs/CHANGELOG.md`:

```markdown
## 2026-06-05 — Dark Command Center redesign

- Full dark-theme visual overhaul: deep-navy background (#060d1c), card surfaces
  (#0c1528/#111e36), cyan brand accent (#06b6d4), atmospheric dot-grid background.
- Added Google Fonts (Sora display + Inter body) via `index.html` preconnect link.
- Replaced hand-rolled SVG donut in `PipelineBreakdown` with an ECharts pie chart
  (`echarts` npm package; `useRef`/`useEffect` lifecycle pattern).
- Replaced progress-bar `StageCounts` with an ECharts horizontal bar chart.
- Board cards now show priority as a coloured left-stripe instead of a badge.
- Kanban columns gain a stage-coloured top bar with glow shadow.
- Stat tiles show a gradient accent bar along the bottom edge.
- Common primitives (Button, Badge, Modal), AppShell, NavBar, ApplicationForm,
  AddColumn, all pages, and all dashboard widgets updated to dark palette.
- `vi.mock('echarts')` added to `DashboardPage.test.tsx` to prevent jsdom canvas errors.
- `src/utils/donut.ts` and its tests retained (still tested, now unused by components).
```

- [ ] **Step 5: Update ARCHITECTURE.md**

In the "File map" section, update the `PipelineBreakdown` and `StageCounts` entries:

```
dashboard/ Panel (section wrapper), StatTiles, StageCounts (ECharts horizontal
           bar — replaces progress bars), PipelineBreakdown (ECharts donut —
           replaces hand-rolled SVG), RecentActivity, FollowUpList
```

Also add a note under "Tech stack" or create a new "Frontend" section noting:

```
Fonts: Sora (display/headings) + Inter (body) via Google Fonts CDN in index.html.
Charts: Apache ECharts v5 (direct, no React wrapper). useRef/useEffect lifecycle:
  init → setOption → window resize listener → dispose on unmount.
  Mocked in tests via vi.mock('echarts') in DashboardPage.test.tsx.
```

- [ ] **Step 6: Add DECISIONS.md entry D13**

```markdown
## D13 — Dark theme: ECharts over echarts-for-react

**Decision:** Use `echarts` (the core package) directly via `useRef`/`useEffect`
rather than the `echarts-for-react` React wrapper.

**Why:** No extra dependency; the wrapper adds no meaningful abstraction beyond
what two hooks already provide. Direct `echarts.init()` makes the jsdom mock
trivial (`vi.mock('echarts', () => ({ init: vi.fn().mockReturnValue({...}) }))`)
and avoids peer-dependency version skew.

**Rejected:** `echarts-for-react` — adds a package for a thin wrapper; mocking
it in tests requires understanding its internal structure.
```

- [ ] **Step 7: Final commit**

```bash
git add docs/STATUS.md docs/CHANGELOG.md docs/ARCHITECTURE.md docs/DECISIONS.md
git commit -m "docs: update STATUS, CHANGELOG, ARCHITECTURE, DECISIONS for dark redesign"
```
