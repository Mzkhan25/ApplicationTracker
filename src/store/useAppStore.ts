import { create } from 'zustand';
import type {
  Application,
  Priority,
  Stage,
  TrackerData,
  WorkMode,
} from '../types';
import type { TrackerRepository } from '../data/repository';
import { LocalStorageRepository } from '../data/localStorageRepository';
import { applicationsInStage, moveCard, reorderStages } from '../services/ordering';

/** Editable fields when creating or updating an application. */
export interface ApplicationInput {
  company: string;
  role: string;
  stageId: string;
  appliedDate: string;
  priority: Priority;
  jobUrl?: string;
  location?: string;
  workMode?: WorkMode;
  salaryMin?: number;
  salaryMax?: number;
  notes?: string;
}

/** Accent colors cycled through when the user adds a new column. */
const STAGE_PALETTE = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#0ea5e9'];

interface AppState extends TrackerData {
  loaded: boolean;
  init: () => Promise<void>;
  addApplication: (input: ApplicationInput) => void;
  updateApplication: (id: string, patch: Partial<ApplicationInput>) => void;
  deleteApplication: (id: string) => void;
  moveApplication: (activeId: string, toStageId: string, toIndex: number) => void;
  addStage: (name: string) => void;
  renameStage: (id: string, name: string) => void;
  setStageFollowUpDays: (id: string, days?: number) => void;
  deleteStage: (id: string) => void;
  moveStage: (activeId: string, overId: string) => void;
}

const repo: TrackerRepository = new LocalStorageRepository();
const nowIso = (): string => new Date().toISOString();

export const useAppStore = create<AppState>((set, get) => {
  /** Apply a dataset change to state and persist it. */
  const commit = (data: TrackerData) => {
    set(data);
    void repo.save(data);
  };

  return {
    stages: [],
    applications: [],
    loaded: false,

    init: async () => {
      const data = await repo.load();
      set({ stages: data.stages, applications: data.applications, loaded: true });
    },

    addApplication: (input) => {
      const { stages, applications } = get();
      const order = applicationsInStage(applications, input.stageId).length;
      const ts = nowIso();
      const app: Application = {
        ...input,
        id: crypto.randomUUID(),
        order,
        createdAt: ts,
        updatedAt: ts,
      };
      commit({ stages, applications: [...applications, app] });
    },

    updateApplication: (id, patch) => {
      const { stages, applications } = get();
      const ts = nowIso();
      const next = applications.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: ts } : a,
      );
      commit({ stages, applications: next });
    },

    deleteApplication: (id) => {
      const { stages, applications } = get();
      commit({ stages, applications: applications.filter((a) => a.id !== id) });
    },

    moveApplication: (activeId, toStageId, toIndex) => {
      const { stages, applications } = get();
      const moved = moveCard(applications, activeId, toStageId, toIndex);
      const ts = nowIso();
      const next = moved.map((a) =>
        a.id === activeId ? { ...a, updatedAt: ts } : a,
      );
      commit({ stages, applications: next });
    },

    addStage: (name) => {
      const { stages, applications } = get();
      const maxOrder = stages.reduce((m, s) => Math.max(m, s.order), -1);
      const stage: Stage = {
        id: crypto.randomUUID(),
        name: name.trim() || 'New stage',
        order: maxOrder + 1,
        color: STAGE_PALETTE[(maxOrder + 1) % STAGE_PALETTE.length],
      };
      commit({ stages: [...stages, stage], applications });
    },

    renameStage: (id, name) => {
      const { stages, applications } = get();
      const next = stages.map((s) =>
        s.id === id ? { ...s, name: name.trim() || s.name } : s,
      );
      commit({ stages: next, applications });
    },

    setStageFollowUpDays: (id, days) => {
      const { stages, applications } = get();
      const next = stages.map((s) =>
        s.id === id ? { ...s, followUpDays: days } : s,
      );
      commit({ stages: next, applications });
    },

    deleteStage: (id) => {
      const { stages, applications } = get();
      if (stages.length <= 1) return; // never remove the last column

      const remaining = stages
        .filter((s) => s.id !== id)
        .sort((a, b) => a.order - b.order)
        .map((s, i) => ({ ...s, order: i }));
      const fallbackId = remaining[0].id;

      // Reassign any cards from the removed column to the first remaining one.
      const reassigned = applications.map((a) =>
        a.stageId === id ? { ...a, stageId: fallbackId, updatedAt: nowIso() } : a,
      );
      commit({ stages: remaining, applications: reassigned });
    },

    moveStage: (activeId, overId) => {
      const { stages, applications } = get();
      commit({ stages: reorderStages(stages, activeId, overId), applications });
    },
  };
});
