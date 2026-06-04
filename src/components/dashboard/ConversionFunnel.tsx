import type { PipelineSummary } from '../../services/metrics';
import { Panel } from './Panel';

/**
 * Funnel of the pipeline: centered, tapering bars whose width is the stage's
 * share of total applications. Shows where applications concentrate and drop
 * off across the ordered stages.
 */
export function ConversionFunnel({ summary }: { summary: PipelineSummary }) {
  const { funnel, total } = summary;

  return (
    <Panel title="Pipeline funnel">
      {total === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          No applications yet.
        </p>
      ) : (
        <div className="space-y-2">
          {funnel.map(({ stage, count }) => {
            const pct = (count / total) * 100;
            return (
              <div key={stage.id} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-xs font-medium text-slate-600">
                  {stage.name}
                </span>
                <div className="flex flex-1 justify-center">
                  <div
                    className="flex h-7 items-center justify-center rounded-md text-xs font-semibold text-white transition-all"
                    style={{
                      width: `${Math.max(pct, 8)}%`,
                      backgroundColor: stage.color,
                    }}
                  >
                    {count}
                  </div>
                </div>
                <span className="w-10 shrink-0 text-right text-xs text-slate-400">
                  {Math.round(pct)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
