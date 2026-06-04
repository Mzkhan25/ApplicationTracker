import type { Stage, TrackerData } from '../types';

export interface StageCount {
  stage: Stage;
  count: number;
}

/** Stages in board order, each paired with how many applications sit in it. */
export function stageCounts(data: TrackerData): StageCount[] {
  return [...data.stages]
    .sort((a, b) => a.order - b.order)
    .map((stage) => ({
      stage,
      count: data.applications.filter((app) => app.stageId === stage.id).length,
    }));
}

export interface PipelineSummary {
  total: number;
  /**
   * Share of applications that advanced past the first (earliest) stage —
   * a semantic-free "did this get any traction" measure that survives
   * renaming or reordering columns. 0 when there are no applications.
   */
  responseRate: number;
  /** Ordered per-stage counts for the funnel visualization. */
  funnel: StageCount[];
}

export function pipelineSummary(data: TrackerData): PipelineSummary {
  const funnel = stageCounts(data);
  const total = data.applications.length;
  const firstStageCount = funnel[0]?.count ?? 0;
  const responseRate = total === 0 ? 0 : (total - firstStageCount) / total;
  return { total, responseRate, funnel };
}
