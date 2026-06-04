import type { Application, Stage, TrackerData } from '../types';

/** Stable color accents for the five default columns. */
const DEFAULT_STAGE_DEFS: ReadonlyArray<{ name: string; color: string }> = [
  { name: 'Applied', color: '#3b82f6' }, // blue
  { name: 'Phone Screen', color: '#8b5cf6' }, // violet
  { name: 'Interview', color: '#f59e0b' }, // amber
  { name: 'Offer', color: '#10b981' }, // emerald
  { name: 'Rejected', color: '#ef4444' }, // red
];

const newId = (): string => crypto.randomUUID();

const isoDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

/** Date-only (YYYY-MM-DD) string N days ago. */
const dateDaysAgo = (days: number): string => isoDaysAgo(days).slice(0, 10);

/** Fresh set of default pipeline columns with generated ids. */
export function createDefaultStages(): Stage[] {
  return DEFAULT_STAGE_DEFS.map((def, index) => ({
    id: newId(),
    name: def.name,
    order: index,
    color: def.color,
  }));
}

/**
 * First-run dataset: the default columns plus a few sample applications so the
 * board and dashboard aren't empty on first load. One sample is intentionally
 * stale (no update in ~12 days) to demonstrate follow-up reminders.
 */
export function createSeedData(): TrackerData {
  const stages = createDefaultStages();
  const byName = (name: string): string =>
    stages.find((s) => s.name === name)!.id;

  const applications: Application[] = [
    {
      id: newId(),
      company: 'Acme Corp',
      role: 'Senior Frontend Engineer',
      stageId: byName('Interview'),
      order: 0,
      appliedDate: dateDaysAgo(14),
      jobUrl: 'https://example.com/jobs/acme-frontend',
      priority: 'high',
      location: 'San Francisco, CA',
      workMode: 'hybrid',
      salaryMin: 160000,
      salaryMax: 190000,
      notes: 'Onsite loop scheduled. Prep system design.',
      createdAt: isoDaysAgo(14),
      updatedAt: isoDaysAgo(2),
    },
    {
      id: newId(),
      company: 'Globex',
      role: 'Full Stack Developer',
      stageId: byName('Phone Screen'),
      order: 0,
      appliedDate: dateDaysAgo(8),
      jobUrl: 'https://example.com/jobs/globex-fullstack',
      priority: 'medium',
      location: 'Remote',
      workMode: 'remote',
      salaryMin: 130000,
      salaryMax: 150000,
      notes: 'Recruiter call went well.',
      createdAt: isoDaysAgo(8),
      updatedAt: isoDaysAgo(12), // stale → shows in follow-ups
    },
    {
      id: newId(),
      company: 'Initech',
      role: 'React Engineer',
      stageId: byName('Applied'),
      order: 0,
      appliedDate: dateDaysAgo(3),
      priority: 'low',
      location: 'Austin, TX',
      workMode: 'onsite',
      createdAt: isoDaysAgo(3),
      updatedAt: isoDaysAgo(3),
    },
    {
      id: newId(),
      company: 'Umbrella',
      role: 'UI Engineer',
      stageId: byName('Offer'),
      order: 0,
      appliedDate: dateDaysAgo(30),
      priority: 'high',
      location: 'Remote',
      workMode: 'remote',
      salaryMin: 145000,
      salaryMax: 170000,
      notes: 'Offer received — negotiating start date.',
      createdAt: isoDaysAgo(30),
      updatedAt: isoDaysAgo(1),
    },
  ];

  return { stages, applications };
}
