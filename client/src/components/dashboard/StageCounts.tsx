import type { StageCount } from '../../services/metrics';
import { Panel } from './Panel';

/** Horizontal bar per stage, scaled to the busiest column. */
export function StageCounts({ counts }: { counts: StageCount[] }) {
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <Panel title="Applications by stage">
      <ul className="space-y-2.5">
        {counts.map(({ stage, count }) => (
          <li key={stage.id} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs font-medium text-slate-600">
              {stage.name}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(count / max) * 100}%`,
                  backgroundColor: stage.color,
                }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-700">
              {count}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
