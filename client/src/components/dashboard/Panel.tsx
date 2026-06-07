import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** White rounded section wrapper used across dashboard widgets. */
export function Panel({ title, action, children, className = '' }: PanelProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
