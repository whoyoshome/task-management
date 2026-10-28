import { useMemo } from 'react';
import type { Board, BoardColumn } from '../../services/boardService';
import type { Task } from '../../hooks';

const COLUMN_STYLES: Record<
  string,
  { title: string; icon: string; bg: string; titleColor: string; countColor: string }
> = {
  pending: { title: 'To Do', icon: '○', bg: 'bg-gray-50', titleColor: 'text-gray-700', countColor: 'text-gray-500' },
  'in-progress': { title: 'In Progress', icon: '◐', bg: 'bg-blue-50', titleColor: 'text-blue-700', countColor: 'text-blue-600' },
  completed: { title: 'Completed', icon: '✓', bg: 'bg-green-50', titleColor: 'text-green-700', countColor: 'text-green-600' },
};

/** Status transitions offered on a card, in display order. */
const TRANSITIONS: Partial<
  Record<Task['status'], { to: Task['status']; label: string; primary?: boolean }[]>
> = {
  pending: [{ to: 'in-progress', label: 'Start' }],
  'in-progress': [
    { to: 'pending', label: 'Back' },
    { to: 'completed', label: 'Complete', primary: true },
  ],
  completed: [{ to: 'in-progress', label: 'Reopen' }],
};

interface Props {
  board: Board;
  tasks: Task[];
  memberName: (userId: string) => string;
  /** Members and admins may create and move tasks; viewers only look. */
  canEdit: boolean;
  onOpen: (task: Task) => void;
  onMove: (task: Task, status: Task['status']) => void;
  onCreateIn: (status: Task['status']) => void;
}

export default function ProjectBoard({
  board,
  tasks,
  memberName,
  canEdit,
  onOpen,
  onMove,
  onCreateIn,
}: Props) {
  const columns = useMemo(
    () =>
      [...(board.columns ?? [])].sort(
        (a: BoardColumn, b: BoardColumn) => a.order_index - b.order_index
      ),
    [board]
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) (map[task.status] ??= []).push(task);
    return map;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {columns.map((column) => {
        const columnTasks = tasksByStatus[column.status] ?? [];
        const style = COLUMN_STYLES[column.status] ?? COLUMN_STYLES.pending;
        const title = COLUMN_STYLES[column.status]?.title ?? column.status;

        return (
          <section key={column.id} aria-label={title} className="flex flex-col">
            <div className={`rounded-t-lg border border-b-0 px-4 py-3 ${style.bg}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xl ${style.titleColor}`}>{style.icon}</span>
                  <h3 className={`font-medium ${style.titleColor}`}>{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {column.wip_limit != null ? (
                    // Soft WIP limit, as in Jira: flagged, never blocking.
                    <span
                      className={`text-sm font-medium ${
                        column.over_wip_limit
                          ? 'rounded bg-red-100 px-2 py-0.5 text-red-700'
                          : style.countColor
                      }`}
                      title={
                        column.over_wip_limit
                          ? `Over the WIP limit of ${column.wip_limit}`
                          : `WIP limit: ${column.wip_limit}`
                      }
                    >
                      {column.task_count ?? columnTasks.length}/{column.wip_limit}
                    </span>
                  ) : (
                    <span className={`text-sm ${style.countColor}`}>
                      {columnTasks.length} {columnTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      aria-label={`Add task to ${title}`}
                      title={`Add task to ${title}`}
                      onClick={() => onCreateIn(column.status)}
                      className={`rounded px-1.5 text-lg leading-none hover:bg-white ${style.titleColor}`}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="min-h-[300px] flex-1 rounded-b-lg border border-t-0 bg-white p-3">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <p className="text-sm">No tasks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="cursor-pointer rounded-lg border bg-white p-4 shadow-sm hover:shadow"
                      onClick={() => onOpen(task)}
                    >
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        Assigned to: {memberName(task.assigned_to)}
                      </div>
                      {canEdit && (
                        <div
                          className="mt-3 flex gap-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {(TRANSITIONS[task.status] ?? []).map((t) => (
                            <button
                              key={t.to}
                              type="button"
                              onClick={() => onMove(task, t.to)}
                              className={`rounded px-3 py-1.5 text-xs ${
                                t.primary
                                  ? 'bg-green-600 text-white'
                                  : 'border border-gray-300 bg-white'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
