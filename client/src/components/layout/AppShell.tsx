import type { ReactNode } from 'react';
import { NavBar } from './NavBar';

/** Page chrome: sticky header with branding + nav, and a content area. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-600 text-sm font-bold text-white">
              AT
            </span>
            <span className="text-base font-semibold text-slate-800">
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
