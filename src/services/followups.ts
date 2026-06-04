import type { Application } from '../types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole days between an ISO timestamp and `now`. */
export function daysSince(iso: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / MS_PER_DAY);
}

/**
 * Applications with no activity (no `updatedAt` change) for more than
 * `thresholdDays`, most-stale first — the follow-up reminder list.
 */
export function staleApplications(
  apps: Application[],
  thresholdDays = 7,
  now: Date = new Date(),
): Application[] {
  return apps
    .filter((app) => daysSince(app.updatedAt, now) > thresholdDays)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
}
