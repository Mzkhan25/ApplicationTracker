import type { TrackerData } from '../types';
import type { TrackerRepository } from './repository';
import { createSeedData } from './seed';

const STORAGE_KEY = 'application-tracker:data';

/**
 * localStorage-backed repository.
 *
 * Stores the entire dataset under a single key as JSON. On first load (nothing
 * stored yet) it seeds default stages and sample applications, then persists
 * them so subsequent loads are stable.
 */
export class LocalStorageRepository implements TrackerRepository {
  async load(): Promise<TrackerData> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seeded = createSeedData();
      await this.save(seeded);
      return seeded;
    }
    return JSON.parse(raw) as TrackerData;
  }

  async save(data: TrackerData): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}
