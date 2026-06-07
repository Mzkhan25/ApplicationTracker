import { describe, it, expect } from 'vitest';
import { LocalStorageRepository } from './localStorageRepository';
import type { TrackerData } from '../types';

describe('LocalStorageRepository', () => {
  it('seeds default stages and sample applications on first load', async () => {
    const repo = new LocalStorageRepository();
    const data = await repo.load();

    expect(data.stages.map((s) => s.name)).toEqual([
      'Applied',
      'Phone Screen',
      'Interview',
      'Offer',
      'Rejected',
    ]);
    expect(data.applications.length).toBeGreaterThan(0);
    // Every application references a real stage.
    const stageIds = new Set(data.stages.map((s) => s.id));
    for (const app of data.applications) {
      expect(stageIds.has(app.stageId)).toBe(true);
    }
  });

  it('persists what was saved and returns it on the next load', async () => {
    const repo = new LocalStorageRepository();
    const data: TrackerData = {
      stages: [{ id: 's1', name: 'Backlog', order: 0, color: '#000' }],
      applications: [
        {
          id: 'a1',
          company: 'Test Co',
          role: 'Engineer',
          stageId: 's1',
          order: 0,
          appliedDate: '2026-06-01',
          priority: 'medium',
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    };

    await repo.save(data);
    const reloaded = await new LocalStorageRepository().load();
    expect(reloaded).toEqual(data);
  });
});
