import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjects, useAuth, useUsers } from '../hooks';
import {
  getMyTasksByProject,
  updateTask,
  deleteTask,
} from '../services/taskService';
import { normalizeTask } from '../utils/status';
import type { Task } from '../hooks/useTasks';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import EditTaskModal from '../components/modals/EditTaskModal';

export default function MyTasksPage() {
  const { projects } = useProjects();
  const { users } = useUsers();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProject = searchParams.get('projectId') || undefined;
  const [projectId, setProjectId] = useState<string | undefined>(
    initialProject
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [throttled, setThrottled] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<any>({ open: false });
  const inFlight = useRef(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      const first = projects[0].id;
      setProjectId(first);
      const p = new URLSearchParams(searchParams);
      p.set('projectId', first);
      setSearchParams(p, { replace: true } as any);
    }
  }, [projects, projectId]);

  const load = async () => {
    if (!projectId || !user?.id) return;
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    setThrottled(false);
    try {
      const items = await getMyTasksByProject(projectId, user.id);
      const list = Array.isArray(items)
        ? items
            .filter((it: any) => it.assigned_to === user.id)
            .map((it: any) => normalizeTask(it))
        : [];
      setTasks(list as Task[]);
    } catch (e: any) {
      const status = e?.response?.status || e?.response?.data?.statusCode;
      if (status === 429) setThrottled(true);
      setError(e?.response?.data?.message || 'Error loading your tasks');
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  useEffect(() => {
    load();
  }, [projectId, user?.id]);

  const onChangeStatus = async (task: any, status: string) => {
    try {
      setActionBusyId(task.id);
      await updateTask(task.id, { status } as any);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to update status');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      setConfirmState((s: any) => ({
        ...s,
        processing: true,
        error: undefined,
      }));
      await deleteTask(taskId);
      setConfirmState({ open: false });
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to delete task';
      setConfirmState((s: any) => ({ ...s, processing: false, error: msg }));
    }
  };

  const todoCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter(
    (t) => t.status === 'in-progress'
  ).length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'to-do') return tasks.filter((t) => t.status === 'pending');
    if (filter === 'in-progress')
      return tasks.filter((t) => t.status === 'in-progress');
    if (filter === 'completed')
      return tasks.filter((t) => t.status === 'completed');
    return tasks;
  }, [tasks, filter]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">My Tasks</h2>
        <p className="text-sm text-gray-500">Tasks assigned to you</p>
      </div>

      {throttled && (
        <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-900">
          The service is busy (429). We'll retry shortly. You can wait a few
          seconds or reload.
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* To Do */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">To Do</p>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-600"></div>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{todoCount}</p>
        </div>

        {/* In Progress */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">In Progress</p>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900">
            {inProgressCount}
          </p>
        </div>

        {/* Completed */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Completed</p>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Tasks Panel */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {/* Filter Tabs and Project Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('to-do')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === 'to-do'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              To Do
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === 'in-progress'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === 'completed'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex items-center gap-3">
            {projects.length > 0 && (
              <select
                value={projectId || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setProjectId(v);
                  const p = new URLSearchParams(searchParams);
                  p.set('projectId', v);
                  setSearchParams(p, { replace: true } as any);
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <button
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800"
              onClick={() => setIsCreateTaskOpen(true)}
            >
              + New Task
            </button>
          </div>
        </div>

        {/* Modals */}
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          onSuccess={() => {
            setIsCreateTaskOpen(false);
            load();
          }}
          defaultProjectId={projectId}
          defaultAssignedTo={user?.id}
        />
        {/* Task List */}
        {loading && (
          <div className="text-center py-8 text-gray-500">Loading…</div>
        )}
        {error && <div className="text-red-600 mb-4">{error}</div>}

        {!loading && filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No tasks assigned in this project.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-5 h-5 mt-1">
                      {t.status === 'completed' ? (
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {t.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="text-orange-600 font-medium">
                          {projects.find((p) => p.id === t.project_id)?.key ||
                            'PROJ'}
                          -{t.id.slice(0, 3)}
                        </span>
                        <span>•</span>
                        <span>
                          Assigned to:{' '}
                          {(() => {
                            const assignedUser = users?.find(
                              (u) => u.id === t.assigned_to
                            );
                            if (assignedUser)
                              return (
                                assignedUser.full_name || assignedUser.email
                              );
                            return 'Unknown user';
                          })()}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            t.status === 'pending'
                              ? 'bg-gray-100 text-gray-700'
                              : t.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {t.status === 'pending'
                            ? 'To Do'
                            : t.status === 'in-progress'
                            ? 'In Progress'
                            : 'Done'}
                        </span>
                        {t.priority && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              t.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : t.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            Priority:{' '}
                            {t.priority === 'high'
                              ? 'High'
                              : t.priority === 'medium'
                              ? 'Medium'
                              : 'Low'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
                      title="Edit"
                      onClick={() => {
                        setSelectedTask(t);
                        setIsEditTaskOpen(true);
                      }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setConfirmState({
                          open: true,
                          title: 'Delete task?',
                          message: 'This action cannot be undone.',
                          onConfirm: () => handleDelete(t.id),
                        });
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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

                {/* Status Change Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                  {t.status === 'pending' && (
                    <button
                      onClick={() => onChangeStatus(t, 'in-progress')}
                      disabled={!!actionBusyId}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        actionBusyId
                          ? 'bg-gray-100 text-gray-400'
                          : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 5l7 7-7 7M5 5l7 7-7 7"
                        />
                      </svg>
                      Start
                    </button>
                  )}
                  {t.status === 'in-progress' && (
                    <>
                      <button
                        onClick={() => onChangeStatus(t, 'pending')}
                        disabled={!!actionBusyId}
                        className={`w-1/2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          actionBusyId
                            ? 'bg-gray-100 text-gray-400'
                            : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 19l-7-7 7-7M19 19l-7-7 7-7"
                          />
                        </svg>
                        Back
                      </button>
                      <button
                        onClick={() => onChangeStatus(t, 'completed')}
                        disabled={!!actionBusyId}
                        className={`w-1/2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          actionBusyId
                            ? 'bg-green-200 text-white/70'
                            : 'text-white bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Complete
                      </button>
                    </>
                  )}
                  {t.status === 'completed' && (
                    <button
                      onClick={() => onChangeStatus(t, 'in-progress')}
                      disabled={!!actionBusyId}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        actionBusyId
                          ? 'bg-gray-100 text-gray-400'
                          : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 19l-7-7 7-7"
                        />
                      </svg>
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmState.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmState.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{confirmState.message}</p>
            {confirmState.error && (
              <div className="mb-4 text-sm text-red-600">
                {confirmState.error}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmState({ open: false })}
                disabled={confirmState.processing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmState.onConfirm}
                disabled={confirmState.processing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {confirmState.processing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={isEditTaskOpen}
        onClose={() => setIsEditTaskOpen(false)}
        onSuccess={load}
        task={selectedTask}
      />
    </div>
  );
}
