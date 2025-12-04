import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth, useProjects } from '../hooks';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import EditProjectModal from '../components/modals/EditProjectModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { deleteProject } from '../services/projectService';
import {
  getMyTasksByProject,
  getTasksByProject,
} from '../services/taskService';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, refetch } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title?: string;
    message?: string;
    processing?: boolean;
    error?: string;
    onConfirm?: () => Promise<void> | void;
  }>({ open: false });

  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id) return;
      for (const p of projects) {
        if (cancelled) break;
        try {
          const items = await getMyTasksByProject(p.id, user.id);
          if (!cancelled)
            setTaskCounts((prev) => ({
              ...prev,
              [p.id]: Array.isArray(items) ? items.length : 0,
            }));
        } catch {
          if (!cancelled) setTaskCounts((prev) => ({ ...prev, [p.id]: 0 }));
        }
      }
    };
    if (projects?.length && user?.id) run();
    return () => {
      cancelled = true;
    };
  }, [projects, user?.id]);

  const handleSelect = (project: any) => {
    navigate(`/projects/${project.id}/board`);
  };

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setIsEditOpen(true);
  };

  const handleDelete = (project: any) => {
    setConfirm({
      open: true,
      title: 'Delete Project',
      message: `This action will delete "${project.name}" and cannot be undone.`,
      onConfirm: async () => {
        try {
          setConfirm((s) => ({ ...s, processing: true, error: undefined }));
          await deleteProject(project.id);
          setConfirm({ open: false });
          await refetch();
        } catch (e: any) {
          setConfirm((s) => ({
            ...s,
            processing: false,
            error: e?.response?.data?.message || 'Error deleting project',
          }));
        }
      },
    });
  };

  const loadData = () => refetch();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-gray-900 mb-1">Projects</h2>
          <p className="text-sm text-gray-500">
            Manage your projects and teams
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          <span className="mr-2">+</span>
          New Project
        </button>
      </div>

      {/* Empty state or grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
          <div className="h-16 w-16 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
            📁
          </div>
          <h3 className="text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first project to start managing tasks and collaborating
            with your team.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
          >
            <span className="mr-2">+</span>
            Create First Project
          </button>
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {projects.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="bg-white p-5 rounded-lg border shadow-sm hover:shadow cursor-pointer"
                onClick={() => handleSelect(p)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      📁
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.key || 'PROJ-001'}
                        {typeof taskCounts[p.id] === 'number'
                          ? ` • ${taskCounts[p.id]} tasks`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(p);
                      }}
                      className="p-2 rounded hover:bg-gray-50 text-gray-600 hover:text-gray-800"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p);
                      }}
                      className="p-2 rounded hover:bg-gray-50 text-red-500 hover:text-red-600"
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
                {p.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {p.description}
                  </p>
                )}
                <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                  👤 <span>1 member</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
      />
      <EditProjectModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedProject(null);
        }}
        onSuccess={loadData}
        project={selectedProject}
      />
      <ConfirmDialog
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        processing={!!confirm.processing}
        error={confirm.error}
        onConfirm={() => confirm.onConfirm && confirm.onConfirm()}
        onClose={() => setConfirm({ open: false })}
      />
    </div>
  );
}
