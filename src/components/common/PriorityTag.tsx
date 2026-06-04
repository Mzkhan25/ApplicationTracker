import type { Priority } from '../../types';
import { Badge } from './Badge';

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: 'High', color: '#ef4444' },
  medium: { label: 'Medium', color: '#f59e0b' },
  low: { label: 'Low', color: '#64748b' },
};

export function PriorityTag({ priority }: { priority: Priority }) {
  const { label, color } = PRIORITY_META[priority];
  return (
    <Badge color={color}>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </Badge>
  );
}
