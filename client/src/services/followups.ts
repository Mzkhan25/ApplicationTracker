import type { Application, Stage } from '../types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole days between an ISO timestamp and `now`. */
export function daysSince(iso: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / MS_PER_DAY);
}

/**
 * Applications due for follow-up: those whose inactivity (`updatedAt`) exceeds
 * their stage's follow-up window. Stages without a window
 * (`followUpDays` unset) never flag — so terminal columns stay silent.
 * Returns most-stale first.
 */
export function staleApplications(
  apps: Application[],
  stages: Stage[],
  now: Date = new Date(),
): Application[] {
  const windowByStage = new Map(stages.map((s) => [s.id, s.followUpDays]));
  return apps
    .filter((app) => {
      const window = windowByStage.get(app.stageId);
      return window != null && daysSince(app.updatedAt, now) > window;
    })
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
}
