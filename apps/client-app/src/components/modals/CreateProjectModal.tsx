import { useState, FormEvent, useEffect } from 'react';
import { createProject } from '../../services/projectService';
import { useAuth, useUsers } from '../../hooks';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Member {
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [form, setForm] = useState({ name: '', description: '' });
  const { users: allUsers } = useUsers();
  const { user: currentUser } = useAuth();
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const users = allUsers.filter((u) => u.id !== currentUser?.id);

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
      await createProject({
        name: form.name,
        key: 'PROJ',
        description: form.description,
        created_by: currentUser.id,
        members: selectedMembers,
      });
      setForm({ name: '', description: '' });
      setSelectedMembers([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', description: '' });
    setSelectedMembers([]);
    setError('');
    onClose();
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => {
      const exists = prev.find(m => m.user_id === userId);
      if (exists) {
        return prev.filter(m => m.user_id !== userId);
      } else {
        return [...prev, { user_id: userId, role: 'member' }];
      }
    });
  };

  const updateMemberRole = (userId: string, role: 'admin' | 'member' | 'viewer') => {
    setSelectedMembers(prev =>
      prev.map(m => m.user_id === userId ? { ...m, role } : m)
    );
  };

  const isMemberSelected = (userId: string) => {
    return selectedMembers.some(m => m.user_id === userId);
  };

  const getMemberRole = (userId: string) => {
    return selectedMembers.find(m => m.user_id === userId)?.role || 'member';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* Header */}
        <h2 className="text-xl font-semibold text-gray-900">New Project</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a new project to organize your tasks.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Nombre del Proyecto */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900">
              Project Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="My Project"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              required
            />
          </div>

          {/* Clave del Proyecto */}
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-900">
              Project Key
            </label>
            <input
              id="key"
              name="key"
              type="text"
              placeholder="PROJ"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              Unique key to identify tasks (e.g., PROJ-123)
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe the project..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              required
            />
          </div>

          {/* Miembros del Equipo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Team Members
            </label>
            
            {/* Current user (Admin) */}
            <div className="mb-3 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentUser?.email}</p>
                  <p className="text-xs text-gray-500">{currentUser?.full_name}</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Admin
              </span>
            </div>

            {/* Available users */}
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
              {users.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">No other users available</p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isMemberSelected(user.id)}
                        onChange={() => toggleMember(user.id)}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.full_name}</p>
                      </div>
                    </div>
                    {isMemberSelected(user.id) && (
                      <select
                        value={getMemberRole(user.id)}
                        onChange={(e) => updateMemberRole(user.id, e.target.value as any)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
