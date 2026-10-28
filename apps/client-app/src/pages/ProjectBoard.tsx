import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getDefaultBoardForProject,
  moveTaskOnBoard,
  type Board,
  type BoardColumn,
} from '../services/boardService';
import { getTasksByProject } from '../services/taskService';
import { getProjectWithMembers } from '../services/projectService';
import { listLabelIdsByTask } from '../services/labelService';
import { useUsers, useAuth, type Task } from '../hooks';
import { useProjectLabels } from '../hooks/useTaskDetails';
import ErrorDialog from '../components/common/ErrorDialog';
import TaskDetailPanel from '../components/modals/TaskDetailPanel';

/** Keeps the API's per-column counts (and WIP flags) in sync after a move. */
export function moveColumnCount(board: Board, from: string, to: string): Board {
  const recount = (column: BoardColumn, delta: number): BoardColumn => {
    const taskCount = Math.max(0, (column.task_count ?? 0) + delta);
    return {
      ...column,
      task_count: taskCount,
      over_wip_limit: column.wip_limit != null && taskCount > column.wip_limit,
    };
  };
  return {
    ...board,
    columns: board.columns.map((column) => {
      if (from === to) return column;
      if (column.status === from) return recount(column, -1);
      if (column.status === to) return recount(column, 1);
      return column;
    }),
  };
}

export default function ProjectBoardPage() {
  const { users } = useUsers();
  const { user } = useAuth();
  const { id } = useParams();
  const projectId = id as string;
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLabelMap, setTaskLabelMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permError, setPermError] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [filterLabelId, setFilterLabelId] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectMemberIds, setProjectMemberIds] = useState<Set<string>>(
    new Set()
  );
  const { data: projectLabels = [] } = useProjectLabels(projectId);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const boardData = await getDefaultBoardForProject(projectId);
      setBoard(boardData);
      // Every task of the project and all label assignments: two requests
      // in total, instead of one per task.
      const [taskItems, labelMap] = await Promise.all([
        getTasksByProject(projectId),
        listLabelIdsByTask(projectId),
      ]);
      setTasks(taskItems);
      setTaskLabelMap(labelMap);

      try {
        const projectData = await getProjectWithMembers(projectId);
        const memberIds = new Set<string>(
          (projectData.members || []).map(
            (member: { user_id: string }) => member.user_id
          )
        );
        setProjectMemberIds(memberIds);
      } catch {
        console.warn('Could not load project members');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Could not load board';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [projectId]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterUserId !== 'all') {
      result = result.filter((task) => task.assigned_to === filterUserId);
    }
    if (filterLabelId !== 'all') {
      result = result.filter((task) =>
        taskLabelMap[task.id]?.includes(filterLabelId)
      );
    }
    return result;
  }, [tasks, filterUserId, filterLabelId, taskLabelMap]);

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const column of board?.columns ?? []) {
      map[column.status] = [];
    }
    for (const task of filteredTasks) {
      const normalizedStatus = (task.status || '')
        .toLowerCase()
        .replace(/_/g, '-');
      if (!map[normalizedStatus]) map[normalizedStatus] = [];
      map[normalizedStatus].push(task);
    }
    return map;
  }, [board, filteredTasks]);

  const onMove = async (task: Task, status: string) => {
    if (!board) return;
    try {
      await moveTaskOnBoard({
        task_id: task.id,
        board_id: board.id,
        status: status as Task['status'],
      });

      setTasks((prevTasks) =>
        prevTasks.map((entry) =>
          entry.id === task.id ? { ...entry, status: status as Task['status'] } : entry
        )
      );
      setBoard((prev) => (prev ? moveColumnCount(prev, task.status, status) : prev));
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; statusCode?: number }; status?: number } })
        .response;
      const msg = response?.data?.message || 'Could not move the task';
      const statusCode = response?.status || response?.data?.statusCode;
      if (statusCode === 403 || /insufficient/i.test(String(msg))) {
        setPermError(typeof msg === 'string' ? msg : 'Insufficient project role');
      } else {
        setError(typeof msg === 'string' ? msg : 'Could not move the task');
      }
      await load();
    }
  };

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!board) return <div>No board found for this project.</div>;

  const statusTitles: Record<string, string> = {
    pending: 'To Do',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };

  const columns = [...(board.columns || [])].sort(
    (a: BoardColumn, b: BoardColumn) => a.order_index - b.order_index
  );

  return (
    <div>
      <TaskDetailPanel
        task={selectedTask}
        users={users}
        isOpen={Boolean(selectedTask)}
        onClose={() => {
          setSelectedTask(null);
          void load();
        }}
      />
      <ErrorDialog
        isOpen={!!permError}
        title="Insufficient permissions"
        message={permError || ''}
        actionLabel="OK"
        onClose={() => setPermError(null)}
      />
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Board</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="user-filter" className="text-sm text-gray-600">
              Member:
            </label>
            <select
              id="user-filter"
              value={filterUserId}
              onChange={(event) => setFilterUserId(event.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
            >
              <option value="all">All Members</option>
              {users
                ?.filter((entry) => projectMemberIds.has(entry.id))
                .map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.full_name || entry.email}
                    {entry.id === user?.id ? ' (You)' : ''}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="label-filter" className="text-sm text-gray-600">
              Label:
            </label>
            <select
              id="label-filter"
              value={filterLabelId}
              onChange={(event) => setFilterLabelId(event.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
            >
              <option value="all">All Labels</option>
              {projectLabels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            Back
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTasks = tasksByStatus[column.status] || [];
          const columnTitle = statusTitles[column.status] || column.status;

          let icon = '○';
          let bgColor = 'bg-gray-50';
          let titleColor = 'text-gray-700';
          let countColor = 'text-gray-500';

          if (column.status === 'in-progress') {
            icon = '◐';
            bgColor = 'bg-blue-50';
            titleColor = 'text-blue-700';
            countColor = 'text-blue-600';
          } else if (column.status === 'completed') {
            icon = '✓';
            bgColor = 'bg-green-50';
            titleColor = 'text-green-700';
            countColor = 'text-green-600';
          }

          return (
            <div key={column.id} className="flex flex-col">
              <div className={`rounded-t-lg ${bgColor} px-4 py-3 border border-b-0`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xl ${titleColor}`}>{icon}</span>
                    <h3 className={`font-medium ${titleColor}`}>{columnTitle}</h3>
                  </div>
                  {column.wip_limit != null ? (
                    // Soft WIP limit, as in Jira: flagged, never blocking.
                    <span
                      className={`text-sm font-medium ${
                        column.over_wip_limit
                          ? 'rounded bg-red-100 px-2 py-0.5 text-red-700'
                          : countColor
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
                    <span className={`text-sm ${countColor}`}>
                      {columnTasks.length} {columnTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 rounded-b-lg border border-t-0 bg-white p-3 min-h-[300px]">
                {columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <p className="text-sm">No tasks</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border bg-white p-4 shadow-sm hover:shadow cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {task.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Assigned to:{' '}
                          {users.find((entry) => entry.id === task.assigned_to)
                            ?.full_name || 'Unknown user'}
                        </div>
                        <div className="mt-3 flex gap-2" onClick={(event) => event.stopPropagation()}>
                          {task.status === 'pending' && (
                            <button
                              onClick={() => onMove(task, 'in-progress')}
                              className="px-3 py-1.5 text-xs rounded bg-white border border-gray-300"
                            >
                              Start
                            </button>
                          )}
                          {task.status === 'in-progress' && (
                            <>
                              <button
                                onClick={() => onMove(task, 'pending')}
                                className="px-3 py-1.5 text-xs rounded bg-white border border-gray-300"
                              >
                                Back
                              </button>
                              <button
                                onClick={() => onMove(task, 'completed')}
                                className="px-3 py-1.5 text-xs rounded bg-green-600 text-white"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          {task.status === 'completed' && (
                            <button
                              onClick={() => onMove(task, 'in-progress')}
                              className="px-3 py-1.5 text-xs rounded bg-white border border-gray-300"
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
