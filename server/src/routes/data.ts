import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { companies, stages, applications } from '../db/schema.js';
import type { Application, Stage, TrackerData } from '../types.js';

export const dataRouter = new Hono();

dataRouter.get('/', async (c) => {
  const userId = (c.get('jwtPayload') as { sub: string }).sub;

  const [stageRows, appRows, companyRows] = await Promise.all([
    db.select().from(stages).where(eq(stages.userId, userId)),
    db.select().from(applications).where(eq(applications.userId, userId)),
    db.select().from(companies).where(eq(companies.userId, userId)),
  ]);

  const companyMap = new Map(companyRows.map((co) => [co.id, co]));

  const stagesOut: Stage[] = stageRows.map((s) => ({
    id: s.id,
    name: s.name,
    order: s.order,
    color: s.color,
    ...(s.followUpDays != null ? { followUpDays: s.followUpDays } : {}),
  }));

  const appsOut: Application[] = appRows.map((a) => {
    const company = companyMap.get(a.companyId);
    return {
      id: a.id,
      company: company?.name ?? '',
      role: a.role,
      stageId: a.stageId,
      order: a.order,
      appliedDate: a.appliedDate,
      priority: a.priority as Application['priority'],
      ...(a.jobUrl ? { jobUrl: a.jobUrl } : {}),
      ...(company?.location ? { location: company.location } : {}),
      ...(a.workMode ? { workMode: a.workMode as Application['workMode'] } : {}),
      ...(a.salaryMin != null ? { salaryMin: a.salaryMin } : {}),
      ...(a.salaryMax != null ? { salaryMax: a.salaryMax } : {}),
      ...(a.demandedSalary != null ? { demandedSalary: a.demandedSalary } : {}),
      ...(a.notes ? { notes: a.notes } : {}),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  });

  return c.json({ stages: stagesOut, applications: appsOut });
});

dataRouter.put('/', async (c) => {
  const userId = (c.get('jwtPayload') as { sub: string }).sub;
  const body = await c.req.json<TrackerData>();

  await db.transaction(async (tx) => {
    // 1. Upsert companies by (userId, name); resolve location from applications
    const uniqueCompanyNames = [...new Set(body.applications.map((a) => a.company).filter(Boolean))];
    if (uniqueCompanyNames.length > 0) {
      await tx
        .insert(companies)
        .values(
          uniqueCompanyNames.map((name) => {
            const app = body.applications.find((a) => a.company === name);
            return { userId, name, location: app?.location ?? null };
          }),
        )
        .onConflictDoUpdate({
          target: [companies.userId, companies.name],
          set: { location: sql`excluded.location` },
        });
    }

    // 2. Build name → id map
    const companyRows = await tx
      .select({ id: companies.id, name: companies.name })
      .from(companies)
      .where(eq(companies.userId, userId));
    const companyMap = new Map(companyRows.map((co) => [co.name, co.id]));

    // 3. Replace stages and applications
    await tx.delete(applications).where(eq(applications.userId, userId));
    await tx.delete(stages).where(eq(stages.userId, userId));

    if (body.stages.length > 0) {
      await tx.insert(stages).values(
        body.stages.map((s) => ({
          id: s.id,
          userId,
          name: s.name,
          order: s.order,
          color: s.color,
          followUpDays: s.followUpDays ?? null,
        })),
      );
    }

    const appsToInsert = body.applications.filter((a) => companyMap.has(a.company));
    if (appsToInsert.length > 0) {
      await tx.insert(applications).values(
        appsToInsert.map((a) => ({
          id: a.id,
          userId,
          companyId: companyMap.get(a.company)!,
          stageId: a.stageId,
          role: a.role,
          order: a.order,
          appliedDate: a.appliedDate,
          jobUrl: a.jobUrl ?? null,
          priority: a.priority,
          workMode: a.workMode ?? null,
          salaryMin: a.salaryMin ?? null,
          salaryMax: a.salaryMax ?? null,
          demandedSalary: a.demandedSalary ?? null,
          notes: a.notes ?? null,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        })),
      );
    }
  });

  return new Response(null, { status: 204 });
});
