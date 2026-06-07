import type { Application, Stage } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { relativeDay } from '../../utils/format';
import { Panel } from './Panel';

interface FollowUpListProps {
  items: Application[];
  stageById: Map<string, Stage>;
  onMarkFollowedUp: (id: string) => void;
}

export function FollowUpList({
  items,
  stageById,
  onMarkFollowedUp,
}: FollowUpListProps) {
  return (
    <Panel
      title="Follow-up reminders"
      action={
        items.length > 0 ? (
          <Badge color="#f59e0b">{items.length} due</Badge>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          You're all caught up. 🎉
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
                  <p className="truncate text-xs text-slate-500">
                    {app.role}
                    {stage && (
                      <>
                        {' · '}
                        <span style={{ color: stage.color }}>{stage.name}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-amber-600">
                    {relativeDay(app.updatedAt)}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onMarkFollowedUp(app.id)}
                  >
                    Done
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
