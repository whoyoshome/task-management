import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  updateProject,
  deleteProject,
  getProjectWithMembers,
} from '../../services/projectService';
import {
  addProjectMember,
  removeProjectMember,
} from '../../services/projectMemberService';
import { useUsers } from '../../hooks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: {
    id: string;
    name: string;
    description?: string;
    key?: string;
  } | null;
}

interface OriginalMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
}
interface MemberPick {
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
}

function EditProjectForm({
  project,
  onClose,
  onSuccess,
}: {
  project: NonNullable<Props['project']>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { users } = useUsers();
  const [form, setForm] = useState({
    name: project.name || '',
    description: project.description || '',
    key: project.key || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [originalMembers, setOriginalMembers] = useState<OriginalMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberPick[]>([]);
  const [memberError, setMemberError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getProjectWithMembers(project.id);
        const orig: OriginalMember[] = Array.isArray(data.members)
          ? data.members.map((m: any) => ({
              id: m.id,
              user_id: m.user_id,
              role: m.role,
            }))
          : [];
        setOriginalMembers(orig);
        setSelectedMembers(
          orig.map((m) => ({ user_id: m.user_id, role: m.role }))
        );
      } catch (e: any) {
        setMemberError(e?.response?.data?.message || 'Failed to load members');
      }
    })();
  }, [project.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      await updateProject(project.id, {
        name: form.name,
        description: form.description,
      });

      const originalByUser = new Map(
        originalMembers.map((m) => [m.user_id, m])
      );
      const selectedByUser = new Map(
        selectedMembers.map((m) => [m.user_id, m])
      );
      const additions = selectedMembers.filter(
        (m) => !originalByUser.has(m.user_id)
      );
      const removals = originalMembers.filter(
        (m) => !selectedByUser.has(m.user_id)
      );
      const roleChanges = selectedMembers.filter((m) => {
        const orig = originalByUser.get(m.user_id);
        return !!orig && orig.role !== m.role;
      });

      for (const r of removals) {
        await removeProjectMember(r.id);
      }

      for (const rc of roleChanges) {
        const orig = originalByUser.get(rc.user_id)!;
        await removeProjectMember(orig.id);
        await addProjectMember({
          project_id: project.id,
          user_id: rc.user_id,
          role: rc.role,
        });
      }

      for (const a of additions) {
        await addProjectMember({
          project_id: project.id,
          user_id: a.user_id,
          role: a.role,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const yes = window.confirm(
      'Delete this project? This will remove all related data.'
    );
    if (!yes) return;
    try {
      setLoading(true);
      await deleteProject(project.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting project');
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (userId: string) =>
    selectedMembers.some((m) => m.user_id === userId);
  const roleOf = (userId: string) =>
    selectedMembers.find((m) => m.user_id === userId)?.role || 'member';
  const toggleUser = (userId: string) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m.user_id === userId);
      if (exists) return prev.filter((m) => m.user_id !== userId);
      return [...prev, { user_id: userId, role: 'member' }];
    });
  };
  const changeRole = (userId: string, role: 'viewer' | 'member' | 'admin') => {
    setSelectedMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role } : m))
    );
  };

  const userLabel = useMemo(() => {
    const map: Record<string, { email?: string; full_name?: string }> = {};
    users.forEach((u) => {
      map[u.id] = { email: u.email, full_name: u.full_name };
    });
    return (userId: string) =>
      map[userId]?.email || map[userId]?.full_name || userId;
  }, [users]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Edit Project</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900">
              Key
            </label>
            <input
              type="text"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Members
            </label>
            {memberError && (
              <div className="mb-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
                {memberError}
              </div>
            )}
            <div className="space-y-2 max-h-56 overflow-y-auto rounded border border-gray-200 p-2">
              {users.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">
                  No users available
                </p>
              ) : (
                users.map((u) => {
                  const checked = isSelected(u.id);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded px-2 py-1 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={() => toggleUser(u.id)}
                        />
                        <div>
                          <p className="text-sm text-gray-900">{u.email}</p>
                          {u.full_name && (
                            <p className="text-xs text-gray-500">
                              {u.full_name}
                            </p>
                          )}
                        </div>
                      </div>
                      {checked && (
                        <select
                          value={roleOf(u.id)}
                          onChange={(e) =>
                            changeRole(u.id, e.target.value as any)
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              🗑 Delete
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditProjectModal({
  isOpen,
  onClose,
  onSuccess,
  project,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
        >
          <EditProjectForm
            project={project}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
