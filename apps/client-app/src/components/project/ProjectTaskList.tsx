import { useMemo, useState } from 'react';
import type { Task } from '../../hooks';
import { TaskStatusBadge } from '../tasks/TaskStatus';
import { taskKey } from '../../utils/taskKey';

type SortKey = 'key' | 'title' | 'status' | 'priority' | 'assignee' | 'due_date';

const STATUS_RANK: Record<string, number> = {
  pending: 1,
  'in-progress': 2,
  blocked: 3,
  completed: 4,
};
const PRIORITY_RANK: Record<string, number> = { low: 1, medium: 2, high: 3 };
const PRIORITY_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'key', label: 'Key' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'due_date', label: 'Due date' },
];

interface Props {
  tasks: Task[];
  projectKey?: string;
  memberName: (userId: string) => string;
  onOpen: (task: Task) => void;
  /** Shown instead of the table when there are no tasks. */
  empty?: React.ReactNode;
}

export default function ProjectTaskList({
  tasks,
  projectKey,
  memberName,
  onOpen,
  empty,
}: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: 'status',
    dir: 1,
  });

  const sorted = useMemo(() => {
    const value = (task: Task): string | number => {
      switch (sort.key) {
        case 'key':
          return task.number ?? 0;
        case 'status':
          return STATUS_RANK[task.status] ?? 0;
        case 'priority':
          return PRIORITY_RANK[task.priority ?? ''] ?? 0;
        case 'assignee':
          return memberName(task.assigned_to).toLowerCase();
        case 'due_date':
          // Tasks without a due date go last in either direction.
          return task.due_date ?? (sort.dir === 1 ? '￿' : '');
        default:
          return task.title.toLowerCase();
      }
    };
    return [...tasks].sort((a, b) => {
      const [x, y] = [value(a), value(b)];
      return x < y ? -sort.dir : x > y ? sort.dir : 0;
    });
  }, [tasks, sort, memberName]);

  const toggle = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 1 ? -1 : 1 } : { key, dir: 1 }
    );

  if (tasks.length === 0) {
    return (
      empty ?? (
        <div className="rounded-lg border bg-white py-12 text-center text-sm text-gray-400">
          No tasks
        </div>
      )
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={
                  sort.key === column.key
                    ? sort.dir === 1
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                className="px-4 py-3 font-medium"
              >
                <button
                  type="button"
                  onClick={() => toggle(column.key)}
                  className="flex items-center gap-1 uppercase hover:text-gray-900"
                >
                  {column.label}
                  {sort.key === column.key && (sort.dir === 1 ? ' ▲' : ' ▼')}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((task) => (
            <tr
              key={task.id}
              onClick={() => onOpen(task)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-orange-600">
                {taskKey(projectKey, task.number) ?? '—'}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
              <td className="px-4 py-3">
                <TaskStatusBadge status={task.status} />
              </td>
              <td className="px-4 py-3 text-gray-700">
                {PRIORITY_LABEL[task.priority ?? ''] ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-700">{memberName(task.assigned_to)}</td>
              <td className="px-4 py-3 text-gray-700">
                {task.due_date ? String(task.due_date).slice(0, 10) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
