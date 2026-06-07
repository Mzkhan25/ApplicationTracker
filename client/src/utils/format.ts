const EUR = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format an exact amount in euros, e.g. "€185,000". */
export function formatMoney(amount: number): string {
  return EUR.format(amount);
}

/** Format a salary range compactly in euros, e.g. "€120k–150k" or "€120k+". */
export function formatSalary(min?: number, max?: number): string | null {
  const k = (n: number) => `${Math.round(n / 1000)}k`;
  if (min != null && max != null) return `€${k(min)}–${k(max)}`;
  if (min != null) return `€${k(min)}+`;
  if (max != null) return `up to €${k(max)}`;
  return null;
}

/** Format an ISO date (YYYY-MM-DD or full ISO) as e.g. "Jun 4". */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

const WORK_MODE_LABELS: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'Onsite',
};

export function workModeLabel(mode?: string): string | null {
  return mode ? (WORK_MODE_LABELS[mode] ?? null) : null;
}

/** Human relative day, e.g. "today", "1d ago", "12d ago". */
export function relativeDay(iso: string, now: Date = new Date()): string {
  const days = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return 'today';
  return `${days}d ago`;
}
