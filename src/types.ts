/**
 * Domain types for the job application tracker.
 *
 * These describe the shape of the data regardless of where it is stored, so
 * both the localStorage repository (today) and a future backend share them.
 */

export type Priority = 'high' | 'medium' | 'low';

export type WorkMode = 'remote' | 'hybrid' | 'onsite';

/** A pipeline column (e.g. "Applied", "Interview"). User-editable. */
export interface Stage {
  id: string;
  name: string;
  /** Position of the column on the board, ascending left-to-right. */
  order: number;
  /** Tailwind-friendly accent color, used for the column header and funnel. */
  color: string;
}

/** A single job application — one card on the board. */
export interface Application {
  id: string;
  company: string;
  role: string;
  /** Which pipeline stage (column) this application currently sits in. */
  stageId: string;
  /** Position within its stage, ascending top-to-bottom. */
  order: number;
  /** ISO date (YYYY-MM-DD) the application was submitted. */
  appliedDate: string;
  jobUrl?: string;
  priority: Priority;
  location?: string;
  workMode?: WorkMode;
  salaryMin?: number;
  salaryMax?: number;
  notes?: string;
  /** ISO timestamps for activity tracking and follow-up staleness. */
  createdAt: string;
  updatedAt: string;
}

/** The complete tracker dataset — the unit the repository loads and saves. */
export interface TrackerData {
  stages: Stage[];
  applications: Application[];
}
