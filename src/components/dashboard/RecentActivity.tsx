import type { Application, Stage } from '../../types';
import { Badge } from '../common/Badge';
import { relativeDay } from '../../utils/format';
import { Panel } from './Panel';

interface RecentActivityProps {
  items: Application[];
  stageById: Map<string, Stage>;
}

export function RecentActivity({ items, stageById }: RecentActivityProps) {
  return (
    <Panel title="Recent activity">
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          No activity yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((app) => {
            const stage = stageById.get(app.stageId);
            return (
              <li
                key={app.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {app.company}
                  </p>
                  <p className="truncate text-xs text-slate-500">{app.role}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {stage && <Badge color={stage.color}>{stage.name}</Badge>}
                  <span className="w-14 text-right text-xs text-slate-400">
                    {relativeDay(app.updatedAt)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
