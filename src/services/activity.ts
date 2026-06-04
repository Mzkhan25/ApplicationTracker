import type { Application } from '../types';

/** Most recently created-or-updated applications first, capped at `limit`. */
export function recentApplications(
  apps: Application[],
  limit = 5,
): Application[] {
  return [...apps]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}
