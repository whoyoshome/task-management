import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getDefaultBoardForProject,
  moveTaskOnBoard,
} from '../services/boardService';
import { getTasksByProject } from '../services/taskService';
import { getProjectWithMembers } from '../services/projectService';
import { useUsers, useAuth } from '../hooks';
import ErrorDialog from '../components/common/ErrorDialog';

export default function ProjectBoardPage() {
  const { users } = useUsers();
  const { user } = useAuth();
  const { id } = useParams();
  const projectId = id as string;
  const [board, setBoard] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permError, setPermError] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [projectMemberIds, setProjectMemberIds] = useState<Set<string>>(
    new Set()
  );

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const b = await getDefaultBoardForProject(projectId);
      setBoard(b);
      const t = await getTasksByProject(projectId);
      setTasks(t);

      // ✅ Cargar miembros del proyecto para el filtro
      try {
        const projectData = await getProjectWithMembers(projectId);
        const memberIds = new Set<string>(
          (projectData.members || []).map((m: any) => m.user_id as string)
        );
        setProjectMemberIds(memberIds);
      } catch (e) {
        // Si falla cargar miembros, continuar sin filtrar
        console.warn('Could not load project members:', e);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not load board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const filteredTasks = useMemo(() => {
    if (filterUserId === 'all') return tasks;
    return tasks.filter((t) => t.assigned_to === filterUserId);
  }, [tasks, filterUserId]);

  const tasksByStatus = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of board?.columns ?? []) map[c.status] = [];
    for (const t of filteredTasks) {
      const normalizedStatus = (t.status || '')
        .toLowerCase()
        .replace(/_/g, '-');
      if (!map[normalizedStatus]) map[normalizedStatus] = [];
      map[normalizedStatus].push(t);
    }
    return map;
  }, [board, filteredTasks]);

  const onMove = async (task: any, status: string) => {
    if (!board) return;
    try {
      const result = await moveTaskOnBoard({
        task_id: task.id,
        board_id: board.id,
        status: status as any,
      });

      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? { ...t, status: status } : t))
      );
    } catch (e: any) {
      console.error('Move error:', e);
      const msg = e?.response?.data?.message || 'Could not move the task';
      const status = e?.response?.status || e?.response?.data?.statusCode;
      if (status === 403 || /insufficient/i.test(String(msg))) {
        setPermError(
          typeof msg === 'string' ? msg : 'Insufficient project role'
        );
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

  return (
    <div>
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
              Filter by:
            </label>
            <select
              id="user-filter"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Members</option>
              {users
                ?.filter((u) => projectMemberIds.has(u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                    {u.id === user?.id ? ' (You)' : ''}
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
        {(board.columns || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((col: any) => {
            const columnTasks = tasksByStatus[col.status] || [];
            const columnTitle = statusTitles[col.status] || col.status;

            let icon = '○';
            let bgColor = 'bg-gray-50';
            let titleColor = 'text-gray-700';
            let countColor = 'text-gray-500';

            if (col.status === 'in-progress') {
              icon = '◐';
              bgColor = 'bg-blue-50';
              titleColor = 'text-blue-700';
              countColor = 'text-blue-600';
            } else if (col.status === 'completed') {
              icon = '✓';
              bgColor = 'bg-green-50';
              titleColor = 'text-green-700';
              countColor = 'text-green-600';
            }

            return (
              <div key={col.id} className="flex flex-col">
                <div
                  className={`rounded-t-lg ${bgColor} px-4 py-3 border border-b-0`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xl ${titleColor}`}>{icon}</span>
                      <h3 className={`font-medium ${titleColor}`}>
                        {columnTitle}
                      </h3>
                    </div>
                    <span className={`text-sm ${countColor}`}>
                      {columnTasks.length}{' '}
                      {columnTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 rounded-b-lg border border-t-0 bg-white p-3 min-h-[300px]">
                  {columnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <div className="text-4xl mb-2">
                        {icon === '○' ? '⏱' : icon === '◐' ? '⏰' : '✓'}
                      </div>
                      <p className="text-sm">No tasks</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {columnTasks.map((t: any) => (
                        <div
                          key={t.id}
                          className="rounded-lg border bg-white p-4 shadow-sm hover:shadow"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <span
                              className={`text-lg ${
                                col.status === 'in-progress'
                                  ? 'text-blue-600'
                                  : col.status === 'completed'
                                  ? 'text-green-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {icon}
                            </span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {t.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Assigned to:{' '}
                                {(() => {
                                  const assignedUser = users?.find(
                                    (u) => u.id === t.assigned_to
                                  );
                                  if (assignedUser)
                                    return (
                                      assignedUser.full_name ||
                                      assignedUser.email
                                    );
                                  return 'Unknown user';
                                })()}
                              </div>
                            </div>
                          </div>
                          {t.description && (
                            <p className="text-xs text-gray-600 mb-3 ml-7">
                              {t.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 ml-7">
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                              {t.status === 'pending'
                                ? 'To Do'
                                : t.status === 'in-progress'
                                ? 'In Progress'
                                : 'Completed'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                              Priority: {t.priority || 'Low'}
                            </span>
                          </div>
                          <div className="mt-3 flex gap-2 ml-7">
                            {t.status === 'pending' && (
                              <button
                                onClick={() => onMove(t, 'in-progress')}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                              >
                                <span>→</span> Start
                              </button>
                            )}
                            {t.status === 'in-progress' && (
                              <>
                                <button
                                  onClick={() => onMove(t, 'pending')}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                                >
                                  <span>←</span> Back
                                </button>
                                <button
                                  onClick={() => onMove(t, 'completed')}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <span>✓</span> Complete
                                </button>
                              </>
                            )}
                            {t.status === 'completed' && (
                              <button
                                onClick={() => onMove(t, 'in-progress')}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                              >
                                <span>↺</span> Reopen
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
