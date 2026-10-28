import { Link } from 'react-router-dom';
import type { Task, TaskStatus } from '../../hooks/useTasks';
import { TaskDoneIcon, TaskStatusBadge } from '../tasks/TaskStatus';

const PRIORITY_STYLES = {
  high: { label: 'High', className: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Low', className: 'bg-gray-100 text-gray-700' },
} as const;

/** Status transitions offered from each status, in display order. */
const TRANSITIONS: Partial<
  Record<TaskStatus, { to: TaskStatus; label: string; primary?: boolean }[]>
> = {
  pending: [{ to: 'in-progress', label: 'Start' }],
  'in-progress': [
    { to: 'pending', label: 'Back' },
    { to: 'completed', label: 'Complete', primary: true },
  ],
  completed: [{ to: 'in-progress', label: 'Reopen' }],
};

interface Props {
  task: Task;
  projectId: string;
  projectKey?: string;
  assigneeName: string;
  busy: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (status: TaskStatus) => void;
}

export default function MyTaskCard({
  task,
  projectId,
  projectKey,
  assigneeName,
  busy,
  onOpen,
  onEdit,
  onDelete,
  onChangeStatus,
}: Props) {
  const priority = task.priority ? PRIORITY_STYLES[task.priority] : undefined;
  const transitions = TRANSITIONS[task.status] ?? [];
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex items-center justify-center w-5 h-5 mt-1">
            <TaskDoneIcon done={task.status === 'completed'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Link
                to={`/projects/${projectId}`}
                onClick={stop}
                title="Open the project"
                className="text-orange-600 font-medium hover:underline"
              >
                {projectKey || 'PROJ'}-{task.id.slice(0, 3)}
              </Link>
              <span>•</span>
              <span>Assigned to: {assigneeName}</span>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
            )}
            <div className="flex items-center gap-2">
              <TaskStatusBadge status={task.status} />
              {priority && (
                <span className={`px-2 py-1 text-xs font-medium rounded ${priority.className}`}>
                  Priority: {priority.label}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4" onClick={stop}>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
            title="Edit"
            aria-label="Edit task"
            onClick={onEdit}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
            title="Delete"
            aria-label="Delete task"
            onClick={onDelete}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {transitions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3" onClick={stop}>
          {transitions.map(({ to, label, primary }) => (
            <button
              key={to}
              onClick={() => onChangeStatus(to)}
              disabled={busy}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                primary
                  ? busy
                    ? 'bg-green-200 text-white/70'
                    : 'text-white bg-green-600 hover:bg-green-700'
                  : busy
                    ? 'bg-gray-100 text-gray-400'
                    : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
