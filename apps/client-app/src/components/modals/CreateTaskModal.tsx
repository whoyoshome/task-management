import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createTask } from '../../services/taskService';
import { useAuth, useProjects, useUsers } from '../../hooks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type StatusValue = 'pending' | 'in-progress' | 'completed' | 'blocked';
type PriorityValue = 'low' | 'medium' | 'high';

const STATUS_OPTIONS: { label: string; value: StatusValue }[] = [
  { label: 'To Do', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Blocked', value: 'blocked' },
];

const PRIORITY_OPTIONS: { label: string; value: PriorityValue }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

export default function CreateTaskModal({ isOpen, onClose, onSuccess, defaultProjectId, defaultAssignedTo }: Props & { defaultProjectId?: string; defaultAssignedTo?: string; }) {
  const { projects } = useProjects();
  const { users } = useUsers();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    project_id: '',
    title: '',
    description: '',
    assigned_to: '',
    status: 'pending' as StatusValue,
    priority: 'medium' as PriorityValue,
    due_date: '',
  });

  // Normalize date helpers
  const toYMD = (val: string): string => {
    // Accepts 'YYYY-MM-DD' or 'DD/MM/YYYY'
    if (!val) return '';
    const ymd = /^\d{4}-\d{2}-\d{2}$/;
    if (ymd.test(val)) return val;
    const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const m = val.match(dmy);
    if (m) {
      const [, d, mth, y] = m;
      return `${y}-${mth}-${d}`;
    }
    // Fallback: try Date parsing
    const d2 = new Date(val);
    if (!isNaN(d2.getTime())) {
      const y = d2.getUTCFullYear();
      const mth = String(d2.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d2.getUTCDate()).padStart(2, '0');
      return `${y}-${mth}-${day}`;
    }
    return val;
  };

  // Return ISO 8601 date-only (YYYY-MM-DD) to align with backend @IsDateString example and 'date' column
  const toISODateOnly = (val: string): string | undefined => {
    if (!val) return undefined;
    const base = toYMD(val);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(base)) return undefined;
    return base;
  };

  useEffect(() => {
    if (!isOpen) return;
    // Apply defaults from props if provided
    if (defaultProjectId) {
      setForm((f) => ({ ...f, project_id: defaultProjectId }));
    } else if (!form.project_id && projects && projects[0]) {
      setForm((f) => ({ ...f, project_id: projects[0].id }));
    }

    if (defaultAssignedTo) {
      setForm((f) => ({ ...f, assigned_to: defaultAssignedTo }));
    } else {
      const me = users?.find((u) => u.id === currentUser?.id);
      if (me && !form.assigned_to) setForm((f) => ({ ...f, assigned_to: me.id }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projects, users, currentUser, defaultProjectId, defaultAssignedTo]);

  const canSubmit = useMemo(() => {
    return (
      !!form.project_id &&
      form.title.trim().length > 0 &&
      form.description.trim().length > 0 &&
      !!form.assigned_to
    );
  }, [form]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    try {
    // Ensure due_date complies with ISO 8601 (date-only) if provided
    const isoDueDate = toISODateOnly(form.due_date);

      await createTask({
        title: form.title,
        description: form.description,
        status: form.status as any,
        priority: form.priority as any,
        due_date: isoDueDate,
        created_by: currentUser.id,
        assigned_to: form.assigned_to,
        project_id: form.project_id,
      } as any);
      onSuccess();
      onClose();
      // reset
      setForm({ project_id: '', title: '', description: '', assigned_to: '', status: 'pending', priority: 'medium', due_date: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button onClick={handleClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">✕</button>

        <h2 className="text-xl font-semibold text-gray-900">New Task</h2>
        <p className="mt-1 text-sm text-gray-500">Create a new task to manage work.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Proyecto */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Project</label>
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Title</label>
            <input
              type="text"
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Description</label>
            <textarea
              placeholder="Describe the task..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              required
            />
          </div>

          {/* Asignado a */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Assigned to</label>
            <select
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">Select a user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
          </div>

          {/* Estado y Prioridad */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-900">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as StatusValue })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as PriorityValue })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha de vencimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Due date</label>
            <input
              type="date"
              value={toYMD(form.due_date)}
              onChange={(e) => setForm({ ...form, due_date: toYMD(e.target.value) })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={!canSubmit || loading} className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
