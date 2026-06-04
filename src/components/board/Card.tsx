import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Application } from '../../types';
import { PriorityTag } from '../common/PriorityTag';
import { Badge } from '../common/Badge';
import { formatSalary, formatShortDate, workModeLabel } from '../../utils/format';

interface CardProps {
  application: Application;
  onClick: () => void;
  /** When true, render a static (non-sortable) preview for the drag overlay. */
  overlay?: boolean;
}

/** A draggable application card. The grip handle drags; the body opens edit. */
export function Card({ application, onClick, overlay = false }: CardProps) {
  const sortable = useSortable({ id: application.id });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    sortable;

  const style = overlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      };

  const salary = formatSalary(application.salaryMin, application.salaryMax);
  const mode = workModeLabel(application.workMode);

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={`group rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${
        overlay ? 'rotate-2 shadow-lg' : 'hover:border-slate-300 hover:shadow'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onClick}
          className="min-w-0 flex-1 text-left"
          aria-label={`Edit ${application.company} – ${application.role}`}
        >
          <p className="truncate text-sm font-semibold text-slate-800">
            {application.company}
          </p>
          <p className="truncate text-xs text-slate-500">{application.role}</p>
        </button>
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag card"
          className="-mr-1 cursor-grab touch-none rounded p-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="7" cy="5" r="1.5" />
            <circle cx="13" cy="5" r="1.5" />
            <circle cx="7" cy="10" r="1.5" />
            <circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="15" r="1.5" />
            <circle cx="13" cy="15" r="1.5" />
          </svg>
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityTag priority={application.priority} />
        {mode && <Badge>{mode}</Badge>}
        {salary && <Badge>{salary}</Badge>}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Applied {formatShortDate(application.appliedDate)}</span>
        {application.location && (
          <span className="truncate pl-2">{application.location}</span>
        )}
      </div>
    </div>
  );
}
