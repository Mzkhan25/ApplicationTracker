import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  /** Optional dot/border accent color (hex). */
  color?: string;
  className?: string;
}

/** A small pill label, optionally tinted with a custom accent color. */
export function Badge({ children, color, className = '' }: BadgeProps) {
  const style = color
    ? { backgroundColor: `${color}1a`, color, borderColor: `${color}33` }
    : undefined;
  return (
    <span
      style={style}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${color ? '' : 'border-slate-200 bg-slate-100 text-slate-600'} ${className}`}
    >
      {children}
    </span>
  );
}
