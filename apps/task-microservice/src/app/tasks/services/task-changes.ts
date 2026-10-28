import { UpdateTaskDto } from '@shared/contracts';
import { Task } from '../entities';

/** Task fields whose changes are recorded in the task history. */
export const TRACKED_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'due_date',
  'assigned_to',
] as const;

export type TrackedField = (typeof TRACKED_FIELDS)[number];

export interface FieldChange {
  field: TrackedField;
  from: string | null;
  to: string | null;
}

const LABELS: Record<TrackedField, string> = {
  title: 'title',
  description: 'description',
  status: 'status',
  priority: 'priority',
  due_date: 'due date',
  assigned_to: 'assignee',
};

// Dates arrive as Date, ISO strings or YYYY-MM-DD; compare by calendar day.
function normalize(field: TrackedField, value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (field === 'due_date') {
    const iso = value instanceof Date ? value.toISOString() : String(value);
    return iso.slice(0, 10);
  }
  return String(value);
}

/** Fields of `dto` that actually change `task`, in a stable order. */
export function diffTask(task: Task, dto: UpdateTaskDto): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of TRACKED_FIELDS) {
    if (!(field in dto)) continue;
    const from = normalize(field, task[field]);
    const to = normalize(field, dto[field]);
    if (from !== to) changes.push({ field, from, to });
  }
  return changes;
}

/**
 * Human-readable entry, e.g. `Changed status from "pending" to "completed"`.
 * The description text is not copied into the history to keep entries short.
 */
export function describeChange({ field, from, to }: FieldChange): string {
  const label = LABELS[field];
  if (field === 'description') return 'Updated the description';
  if (from === null) return `Set ${label} to "${to}"`;
  if (to === null) return `Cleared ${label} (was "${from}")`;
  return `Changed ${label} from "${from}" to "${to}"`;
}

/** Metadata stored with a change; the description values are omitted. */
export function changeMetadata(change: FieldChange): Record<string, unknown> {
  return change.field === 'description'
    ? { field: change.field }
    : { field: change.field, from: change.from, to: change.to };
}
