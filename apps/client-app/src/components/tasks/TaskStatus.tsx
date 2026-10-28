import type { TaskStatus } from '../../hooks/useTasks';

const STATUS_STYLES: Record<TaskStatus, { label: string; className: string }> = {
  pending: { label: 'To Do', className: 'bg-gray-100 text-gray-700' },
  'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Done', className: 'bg-green-100 text-green-700' },
  blocked: { label: 'Blocked', className: 'bg-red-100 text-red-700' },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${style.className}`}>
      {style.label}
    </span>
  );
}

/** Check mark for completed tasks, empty box otherwise. */
export function TaskDoneIcon({ done }: { done: boolean }) {
  if (!done) {
    return <div className="w-5 h-5 rounded border-2 border-gray-300" />;
  }
  return (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
