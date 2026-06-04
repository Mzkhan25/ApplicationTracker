import type { Application, Stage } from '../types';

/** Applications belonging to a stage, sorted by their in-column order. */
export function applicationsInStage(
  apps: Application[],
  stageId: string,
): Application[] {
  return apps
    .filter((a) => a.stageId === stageId)
    .sort((a, b) => a.order - b.order);
}

const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(n, max));

/**
 * Move a card to a target stage at a target index, returning a new array with
 * `order` re-indexed (0..n) for every affected stage. Pure: does not mutate
 * input and does not touch timestamps (the caller bumps `updatedAt`).
 *
 * Handles both cross-column moves and intra-column reordering.
 */
export function moveCard(
  apps: Application[],
  activeId: string,
  toStageId: string,
  toIndex: number,
): Application[] {
  const active = apps.find((a) => a.id === activeId);
  if (!active) return apps;

  const fromStageId = active.stageId;
  const remaining = apps.filter((a) => a.id !== activeId);

  // Build the target column's new ordering with the active card inserted.
  const target = applicationsInStage(remaining, toStageId);
  target.splice(clamp(toIndex, 0, target.length), 0, {
    ...active,
    stageId: toStageId,
  });
  const targetOrder = new Map(target.map((a, i) => [a.id, i]));

  // If it left a different column, that column's orders also compact.
  const sourceOrder =
    fromStageId === toStageId
      ? null
      : new Map(
          applicationsInStage(remaining, fromStageId).map((a, i) => [a.id, i]),
        );

  return apps.map((a) => {
    if (a.id === activeId) {
      return { ...a, stageId: toStageId, order: targetOrder.get(a.id)! };
    }
    if (a.stageId === toStageId) {
      return { ...a, order: targetOrder.get(a.id)! };
    }
    if (sourceOrder && a.stageId === fromStageId) {
      return { ...a, order: sourceOrder.get(a.id)! };
    }
    return a;
  });
}

/** Reorder stages by moving `activeId` to `overId`'s position. Pure. */
export function reorderStages(
  stages: Stage[],
  activeId: string,
  overId: string,
): Stage[] {
  const ordered = [...stages].sort((a, b) => a.order - b.order);
  const from = ordered.findIndex((s) => s.id === activeId);
  const to = ordered.findIndex((s) => s.id === overId);
  if (from === -1 || to === -1 || from === to) return stages;

  const [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);
  return ordered.map((s, i) => ({ ...s, order: i }));
}
