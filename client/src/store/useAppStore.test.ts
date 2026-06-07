import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore.setStageFollowUpDays', () => {
  beforeEach(async () => {
    await useAppStore.getState().init();
  });

  it('sets a follow-up window on a stage and persists it', () => {
    const stageId = useAppStore.getState().stages[0].id;
    useAppStore.getState().setStageFollowUpDays(stageId, 10);

    const stage = useAppStore.getState().stages.find((s) => s.id === stageId)!;
    expect(stage.followUpDays).toBe(10);
  });

  it('clears a follow-up window when given undefined', () => {
    const stageId = useAppStore.getState().stages[0].id;
    useAppStore.getState().setStageFollowUpDays(stageId, 10);
    useAppStore.getState().setStageFollowUpDays(stageId, undefined);

    const stage = useAppStore.getState().stages.find((s) => s.id === stageId)!;
    expect(stage.followUpDays).toBeUndefined();
  });
});
