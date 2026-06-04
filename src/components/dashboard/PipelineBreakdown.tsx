import type { PipelineSummary } from '../../services/metrics';
import { donutSegments } from '../../utils/donut';
import { Panel } from './Panel';

const SIZE = 132;
const STROKE = 20;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut of the pipeline: each stage is a slice sized by its share of total
 * applications, with the total in the center and a legend (count + %). Shows
 * proportion across stages — complementing StageCounts, which shows magnitude.
 */
export function PipelineBreakdown({ summary }: { summary: PipelineSummary }) {
  const { funnel, total } = summary;
  const segments = donutSegments(
    funnel.map((f) => f.count),
    CIRCUMFERENCE,
  );

  return (
    <Panel title="Pipeline breakdown">
      {total === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          No applications yet.
        </p>
      ) : (
        <div className="flex items-center gap-5">
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="shrink-0"
            role="img"
            aria-label="Applications by stage, as a share of the total"
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={STROKE}
            />
            <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
              {segments.map((seg, i) =>
                seg.dashLength > 0 ? (
                  <circle
                    key={funnel[i].stage.id}
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke={funnel[i].stage.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${seg.dashLength} ${seg.dashGap}`}
                    strokeDashoffset={seg.offset}
                  />
                ) : null,
              )}
            </g>
            <text
              x={CENTER}
              y={CENTER - 3}
              textAnchor="middle"
              className="fill-slate-800 text-2xl font-bold"
            >
              {total}
            </text>
            <text
              x={CENTER}
              y={CENTER + 14}
              textAnchor="middle"
              className="fill-slate-400 text-[11px]"
            >
              total
            </text>
          </svg>

          <ul className="flex-1 space-y-1.5">
            {funnel.map(({ stage, count }, i) => (
              <li key={stage.id} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="flex-1 truncate text-slate-600">
                  {stage.name}
                </span>
                <span className="font-semibold text-slate-700">{count}</span>
                <span className="w-9 text-right text-slate-400">
                  {Math.round(segments[i].fraction * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
