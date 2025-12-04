import { FormEvent, useEffect, useMemo, useState } from 'react';
import { updateTask, deleteTask } from '../../services/taskService';
import { useAuth, useProjects, useUsers } from '../../hooks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: {
    id: string;
    project_id: string;
    title: string;
    description?: string;
    assigned_to: string;
    status: 'pending' | 'in-progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
  } | null;
}

const STATUS_OPTIONS = [
  { label: 'To Do', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Blocked', value: 'blocked' },
] as const;

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
] as const;

export default function EditTaskModal({ isOpen, onClose, onSuccess, task }: Props) {
  const { projects } = useProjects();
  const { users } = useUsers();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'blocked',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
  });

  // Normalize date helpers
  const toYMD = (val: string): string => {
    if (!val) return '';
    const ymd = /^\d{4}-\d{2}-\d{2}$/;
    if (ymd.test(val)) return val;
    const d2 = new Date(val);
    if (!isNaN(d2.getTime())) {
      const y = d2.getUTCFullYear();
      const mth = String(d2.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d2.getUTCDate()).padStart(2, '0');
      return `${y}-${mth}-${day}`;
    }
    return val;
  };

  const toISODateOnly = (val: string): string | undefined => {
    if (!val) return undefined;
    const base = toYMD(val);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(base)) return undefined;
    return base;
  };

  useEffect(() => {
    if (!isOpen || !task) return;
    setForm({
      title: task.title || '',
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      status: (task.status as any) || 'pending',
      priority: (task.priority as any) || 'medium',
      due_date: toYMD(task.due_date || ''),
    });
  }, [isOpen, task]);

  const canSubmit = useMemo(() => {
    return (
      !!form.title.trim() &&
      !!form.description.trim() &&
      !!form.assigned_to
    );
  }, [form]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateTask(task.id, {
        title: form.title,
        description: form.description,
        status: form.status as any,
        priority: form.priority as any,
        due_date: toISODateOnly(form.due_date),
        assigned_to: form.assigned_to,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    const yes = window.confirm('Delete this task? This action cannot be undone.');
    if (!yes) return;
    try {
      setLoading(true);
      await deleteTask(task.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting task');
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

        <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
        <p className="mt-1 text-sm text-gray-500">Update task details or delete it.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Proyecto (solo lectura) */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Project</label>
            <input
              value={projects.find((p) => p.id === task.project_id)?.name || '—'}
              readOnly
              className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
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
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
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
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
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

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              🗑 Delete
            </button>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={!canSubmit || loading} className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
