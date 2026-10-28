import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { getErrorMessage } from '../../utils/errors';
import {
  useAuth,
  useCreateTask,
  useProjectMembers,
  useProjects,
  type Task,
} from '../../hooks';

type TaskStatus = Task['status'];
type TaskPriority = NonNullable<Task['priority']>;

// Only statuses with a board column: a "blocked" task would be invisible.
const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: 'To Do', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
];

const PRIORITY_OPTIONS: { label: string; value: TaskPriority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (task: Task) => void;
  /**
   * The project the task belongs to. Inside a project it is fixed; without
   * it the user must pick one.
   */
  projectId?: string;
  /** Initial status, e.g. the board column the task is created from. */
  defaultStatus?: TaskStatus;
  /** Preferred assignee when they belong to the project; else the user. */
  defaultAssigneeId?: string;
}

/** Task creation, reusable inside a project or from anywhere in the app. */
export default function CreateTaskModal(props: CreateTaskModalProps) {
  // Mounted only while open, so every opening starts from a clean form.
  return props.isOpen ? <CreateTaskDialog {...props} /> : null;
}

function CreateTaskDialog({
  onClose,
  onCreated,
  projectId: fixedProjectId,
  defaultStatus = 'pending',
  defaultAssigneeId,
}: CreateTaskModalProps) {
  const id = useId();
  const { user } = useAuth();
  const { projects } = useProjects();
  const createTask = useCreateTask();
  const titleRef = useRef<HTMLInputElement>(null);

  const [projectId, setProjectId] = useState(fixedProjectId ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  const {
    project,
    members,
    isLoading: membersLoading,
    canCreateTasks,
  } = useProjectMembers(projectId || undefined);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // The API only accepts project members as assignees. Until the user picks
  // one, default to the requested assignee, else to the user.
  const isMember = (userId?: string) =>
    Boolean(userId) && members.some((m) => m.user_id === userId);
  const assignee =
    [assigneeId, defaultAssigneeId, user?.id].find(isMember) ?? '';

  const noAccess = Boolean(projectId) && !membersLoading && !canCreateTasks;
  const canSubmit =
    Boolean(projectId) &&
    title.trim().length > 0 &&
    Boolean(assignee) &&
    canCreateTasks &&
    !createTask.isPending;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    createTask.mutate(
      {
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        assigned_to: assignee,
        status,
        priority,
        due_date: dueDate || undefined,
      },
      {
        onSuccess: (task) => {
          onCreated?.(task as Task);
          onClose();
        },
      }
    );
  };

  const inputClass =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50';
  const labelClass = 'block text-sm font-medium text-gray-900';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-heading`}
        className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 id={`${id}-heading`} className="text-xl font-semibold text-gray-900">
          New Task
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {fixedProjectId
            ? `In ${project?.name ?? 'this project'}`
            : 'Choose the project the task belongs to.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!fixedProjectId && (
            <div>
              <label htmlFor={`${id}-project`} className={labelClass}>
                Project
              </label>
              <select
                id={`${id}-project`}
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setAssigneeId('');
                }}
                className={inputClass}
                required
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor={`${id}-title`} className={labelClass}>
              Title
            </label>
            <input
              id={`${id}-title`}
              ref={titleRef}
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor={`${id}-description`} className={labelClass}>
              Description <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <textarea
              id={`${id}-description`}
              placeholder="Add details…"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={`${id}-assignee`} className={labelClass}>
              Assignee
            </label>
            <select
              id={`${id}-assignee`}
              value={assignee}
              onChange={(event) => setAssigneeId(event.target.value)}
              disabled={!projectId || membersLoading || members.length === 0}
              className={inputClass}
            >
              {!assignee && (
                <option value="">
                  {!projectId
                    ? 'Select a project first'
                    : membersLoading
                      ? 'Loading members…'
                      : 'Select a member'}
                </option>
              )}
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.full_name || member.email || member.user_id}
                  {member.user_id === user?.id ? ' (You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor={`${id}-status`} className={labelClass}>
                Status
              </label>
              <select
                id={`${id}-status`}
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-priority`} className={labelClass}>
                Priority
              </label>
              <select
                id={`${id}-priority`}
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                className={inputClass}
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-due`} className={labelClass}>
                Due date
              </label>
              <input
                id={`${id}-due`}
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {noAccess && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              You need member access to this project to create tasks.
            </div>
          )}
          {createTask.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {getErrorMessage(createTask.error, 'Error creating task')}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {createTask.isPending ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
