import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useAuth,
  useDeleteTask,
  useInvalidateTasks,
  useMyTasks,
  useProjects,
  useUpdateTaskStatus,
  useUsers,
} from '../hooks';
import type { Task } from '../hooks';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import EditTaskModal from '../components/modals/EditTaskModal';
import TaskDetailPanel from '../components/modals/TaskDetailPanel';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MyTaskCard from '../components/my-tasks/MyTaskCard';
import {
  matchesStatus,
  StatusFilterTabs,
  StatusSummary,
  type StatusFilterValue,
} from '../components/my-tasks/StatusFilter';

const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

export default function MyTasksPage() {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { users } = useUsers();
  const { data: myTasks = [], isLoading, error } = useMyTasks();
  const invalidateTasks = useInvalidateTasks();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  // The selected project lives in the URL (?projectId=), empty = all.
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const selectProject = (id: string) => {
    const params = new URLSearchParams(searchParams);
    if (id) params.set('projectId', id);
    else params.delete('projectId');
    setSearchParams(params, { replace: true });
  };

  const [filter, setFilter] = useState<StatusFilterValue>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // One request for every project; the project filter is applied locally.
  const projectTasks = useMemo(
    () => (projectId ? myTasks.filter((t) => t.project_id === projectId) : myTasks),
    [myTasks, projectId]
  );
  const visibleTasks = projectTasks.filter((task) => matchesStatus(task, filter));

  const assigneeName = (id: string) => {
    const assignee = users.find((u) => u.id === id);
    return assignee ? assignee.full_name || assignee.email : 'Unknown user';
  };

  const changeStatus = (task: Task, status: Task['status']) =>
    updateStatus.mutate(
      { id: task.id, status },
      { onError: (e) => alert(errorMessage(e, 'Failed to update status')) }
    );

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">My Tasks</h2>
        <p className="text-sm text-gray-500">Tasks assigned to you</p>
      </div>

      <StatusSummary tasks={projectTasks} />

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <StatusFilterTabs value={filter} onChange={setFilter} />
          <div className="flex items-center gap-3">
            <select
              aria-label="Project"
              value={projectId}
              onChange={(e) => selectProject(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800"
              onClick={() => setIsCreateOpen(true)}
            >
              + New Task
            </button>
          </div>
        </div>

        {isLoading && <div className="text-center py-8 text-gray-500">Loading…</div>}
        {error && (
          <div className="text-red-600 mb-4">
            {errorMessage(error, 'Error loading your tasks')}
          </div>
        )}

        {!isLoading && visibleTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{projectId ? 'No tasks assigned in this project.' : 'No tasks assigned to you.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleTasks.map((task) => (
              <MyTaskCard
                key={task.id}
                task={task}
                projectKey={projects.find((p) => p.id === task.project_id)?.key}
                assigneeName={assigneeName(task.assigned_to)}
                busy={updateStatus.isPending}
                onOpen={() => setDetailTask(task)}
                onEdit={() => setEditTask(task)}
                onDelete={() => setTaskToDelete(task)}
                onChangeStatus={(status) => changeStatus(task, status)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          void invalidateTasks();
        }}
        defaultProjectId={projectId || undefined}
        defaultAssignedTo={user?.id}
        lockProject={Boolean(projectId)}
      />

      <EditTaskModal
        isOpen={Boolean(editTask)}
        onClose={() => setEditTask(null)}
        onSuccess={() => void invalidateTasks()}
        task={editTask}
      />

      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        title="Delete task?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        processing={deleteTask.isPending}
        error={deleteTask.error ? errorMessage(deleteTask.error, 'Failed to delete task') : undefined}
        onConfirm={() => {
          if (!taskToDelete) return;
          deleteTask.mutate(taskToDelete.id, {
            onSuccess: () => setTaskToDelete(null),
          });
        }}
        onClose={() => {
          setTaskToDelete(null);
          deleteTask.reset();
        }}
      />

      <TaskDetailPanel
        task={detailTask}
        users={users}
        isOpen={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
      />
    </div>
  );
}
