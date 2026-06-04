import { describe, it, expect } from 'vitest';
import type { Application, Stage, TrackerData } from '../types';
import { applicationsInStage, moveCard, reorderStages } from './ordering';
import { pipelineSummary, stageCounts } from './metrics';
import { staleApplications, daysSince } from './followups';
import { recentApplications } from './activity';

const stage = (id: string, order: number): Stage => ({
  id,
  name: id,
  order,
  color: '#000',
});

const app = (id: string, stageId: string, order: number): Application => ({
  id,
  company: id,
  role: 'Engineer',
  stageId,
  order,
  appliedDate: '2026-06-01',
  priority: 'medium',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
});

describe('ordering.moveCard', () => {
  const apps = [
    app('a', 's1', 0),
    app('b', 's1', 1),
    app('c', 's2', 0),
  ];

  it('moves a card to another stage at the given index', () => {
    const next = moveCard(apps, 'a', 's2', 0);
    const s2 = applicationsInStage(next, 's2').map((x) => x.id);
    expect(s2).toEqual(['a', 'c']);
    // Source column re-indexes to 0..n with no gaps.
    expect(applicationsInStage(next, 's1').map((x) => x.id)).toEqual(['b']);
    expect(next.find((x) => x.id === 'b')!.order).toBe(0);
  });

  it('reorders within the same stage', () => {
    const next = moveCard(apps, 'a', 's1', 1);
    expect(applicationsInStage(next, 's1').map((x) => x.id)).toEqual(['b', 'a']);
  });

  it('returns input unchanged for an unknown card', () => {
    expect(moveCard(apps, 'zzz', 's2', 0)).toBe(apps);
  });
});

describe('ordering.reorderStages', () => {
  it('moves a stage to a new position and re-indexes order', () => {
    const stages = [stage('s1', 0), stage('s2', 1), stage('s3', 2)];
    const next = reorderStages(stages, 's3', 's1');
    expect(next.map((s) => s.id)).toEqual(['s3', 's1', 's2']);
    expect(next.map((s) => s.order)).toEqual([0, 1, 2]);
  });
});

describe('metrics', () => {
  const data: TrackerData = {
    stages: [stage('s1', 0), stage('s2', 1)],
    applications: [app('a', 's1', 0), app('b', 's2', 0), app('c', 's2', 1)],
  };

  it('counts applications per stage in board order', () => {
    expect(stageCounts(data).map((c) => [c.stage.id, c.count])).toEqual([
      ['s1', 1],
      ['s2', 2],
    ]);
  });

  it('computes response rate as share past the first stage', () => {
    const summary = pipelineSummary(data);
    expect(summary.total).toBe(3);
    expect(summary.responseRate).toBeCloseTo(2 / 3);
  });

  it('reports a zero response rate with no applications', () => {
    const empty = pipelineSummary({ stages: data.stages, applications: [] });
    expect(empty.responseRate).toBe(0);
  });
});

describe('followups', () => {
  const now = new Date('2026-06-04T00:00:00.000Z');
  const withUpdated = (id: string, updatedAt: string): Application => ({
    ...app(id, 's1', 0),
    updatedAt,
  });

  it('counts whole days since a timestamp', () => {
    expect(daysSince('2026-05-28T00:00:00.000Z', now)).toBe(7);
  });

  it('flags only applications stale beyond the threshold, most stale first', () => {
    const apps = [
      withUpdated('fresh', '2026-06-03T00:00:00.000Z'), // 1 day
      withUpdated('stale', '2026-05-25T00:00:00.000Z'), // 10 days
      withUpdated('stalest', '2026-05-20T00:00:00.000Z'), // 15 days
    ];
    const result = staleApplications(apps, 7, now).map((a) => a.id);
    expect(result).toEqual(['stalest', 'stale']);
  });
});

describe('activity', () => {
  it('returns most recently updated applications first', () => {
    const apps = [
      { ...app('old', 's1', 0), updatedAt: '2026-06-01T00:00:00.000Z' },
      { ...app('new', 's1', 1), updatedAt: '2026-06-03T00:00:00.000Z' },
    ];
    expect(recentApplications(apps, 5).map((a) => a.id)).toEqual(['new', 'old']);
  });
});
