import { useCallback, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  projectMembersQueryKey,
  taskLabelMapQueryKey,
  useAuth,
  useInvalidateTasks,
  useMoveTask,
  useProjectBoard,
  useProjectLabels,
  useProjectMembers,
  useUsers,
  type Task,
} from '../hooks';
import { PROJECTS_QUERY_KEY } from '../hooks/useProjects';
import { getErrorMessage } from '../utils/errors';
import ErrorDialog from '../components/common/ErrorDialog';
import TaskDetailPanel from '../components/modals/TaskDetailPanel';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import EditProjectModal from '../components/modals/EditProjectModal';
import ProjectHeader from '../components/project/ProjectHeader';
import ProjectBoard from '../components/project/ProjectBoard';
import ProjectTaskList from '../components/project/ProjectTaskList';
import ProjectViewTabs, { type ProjectView } from '../components/project/ProjectViewTabs';

/**
 * A project's home: its tasks as a board or a list, and where tasks are
 * created and assigned to any project member. View and filters live in the
 * URL (?view=, ?member=, ?label=) so they survive reloads and can be shared.
 */
export default function ProjectPage() {
  const { id: projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { users } = useUsers();
  const invalidateTasks = useInvalidateTasks();

  const { project, members, canCreateTasks, canManageMembers } =
    useProjectMembers(projectId);
  const { board, tasks, taskLabelMap, isLoading, error } = useProjectBoard(projectId);
  const { data: projectLabels = [] } = useProjectLabels(projectId);
  const moveTask = useMoveTask(projectId);

  const view: ProjectView = searchParams.get('view') === 'list' ? 'list' : 'board';
  const memberFilter = searchParams.get('member') ?? '';
  const labelFilter = searchParams.get('label') ?? '';
  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params, { replace: true });
  };

  const [createIn, setCreateIn] = useState<Task['status'] | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  const memberName = useCallback(
    (userId: string) => {
      const member = members.find((m) => m.user_id === userId);
      // A former member keeps their tasks: fall back to the user list.
      const account = member ?? users.find((u) => u.id === userId);
      return account?.full_name || account?.email || 'Unknown user';
    },
    [members, users]
  );

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!memberFilter || task.assigned_to === memberFilter) &&
          (!labelFilter || taskLabelMap[task.id]?.includes(labelFilter))
      ),
    [tasks, memberFilter, labelFilter, taskLabelMap]
  );

  const onMove = (task: Task, status: Task['status']) => {
    if (!board) return;
    moveTask.mutate(
      { task, board, status },
      {
        onError: (err) => {
          const statusCode = (err as { response?: { status?: number } }).response
            ?.status;
          const message = getErrorMessage(err, 'Could not move the task');
          setPermError(
            statusCode === 403 ? message || 'Insufficient project role' : message
          );
        },
      }
    );
  };

  if (isLoading) return <div>Loading…</div>;
  if (error) {
    return (
      <div className="text-red-600">{getErrorMessage(error, 'Could not load the project')}</div>
    );
  }

  const selectClass =
    'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm';

  return (
    <div>
      <ProjectHeader
        project={project}
        members={members}
        canCreateTasks={canCreateTasks}
        canManageMembers={canManageMembers}
        onNewTask={() => setCreateIn('pending')}
        onManageMembers={() => setIsMembersOpen(true)}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <ProjectViewTabs value={view} onChange={(next) => setParam('view', next === 'board' ? '' : next)} />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Member:
            <select
              value={memberFilter}
              onChange={(event) => setParam('member', event.target.value)}
              className={selectClass}
            >
              <option value="">All Members</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.full_name || member.email}
                  {member.user_id === user?.id ? ' (You)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Label:
            <select
              value={labelFilter}
              onChange={(event) => setParam('label', event.target.value)}
              className={selectClass}
            >
              <option value="">All Labels</option>
              {projectLabels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {view === 'list' ? (
        <ProjectTaskList
          tasks={visibleTasks}
          memberName={memberName}
          onOpen={setSelectedTask}
        />
      ) : board ? (
        <ProjectBoard
          board={board}
          tasks={visibleTasks}
          memberName={memberName}
          canEdit={canCreateTasks}
          onOpen={setSelectedTask}
          onMove={onMove}
          onCreateIn={setCreateIn}
        />
      ) : (
        <div>No board found for this project.</div>
      )}

      <CreateTaskModal
        isOpen={createIn !== null}
        onClose={() => setCreateIn(null)}
        projectId={projectId}
        defaultStatus={createIn ?? undefined}
      />
      <TaskDetailPanel
        task={selectedTask}
        users={users}
        isOpen={Boolean(selectedTask)}
        onClose={() => {
          setSelectedTask(null);
          // The panel edits fields and labels: refresh what the page shows.
          void invalidateTasks();
          void queryClient.invalidateQueries({
            queryKey: taskLabelMapQueryKey(projectId),
          });
        }}
      />
      {canManageMembers && project && (
        <EditProjectModal
          isOpen={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: projectMembersQueryKey(projectId) });
            void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
          }}
          project={{ ...project, description: project.description ?? undefined }}
        />
      )}
      <ErrorDialog
        isOpen={Boolean(permError)}
        title="Could not move the task"
        message={permError ?? ''}
        actionLabel="OK"
        onClose={() => setPermError(null)}
      />
    </div>
  );
}
