import type { TrackerData } from '../types';

/**
 * Persistence boundary for the tracker.
 *
 * The store and UI depend only on this interface, never on a concrete storage
 * mechanism. Today it is backed by localStorage; swapping in an HTTP/database
 * implementation later means writing one new class and changing one line where
 * the repository is constructed — no UI changes required.
 *
 * The contract is intentionally coarse-grained (load/save the whole dataset):
 * the in-memory store is the source of truth and the dataset is small, so a
 * full snapshot read/write keeps the moving parts to a minimum.
 */
export interface TrackerRepository {
  /** Load the full dataset. Implementations seed defaults on first use. */
  load(): Promise<TrackerData>;
  /** Persist the full dataset, replacing whatever was stored. */
  save(data: TrackerData): Promise<void>;
}
