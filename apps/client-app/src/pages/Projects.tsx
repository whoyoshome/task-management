import { getErrorMessage } from '../utils/errors';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth, useProjects, useTaskCounts } from '../hooks';
import type { Project } from '../hooks';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import EditProjectModal from '../components/modals/EditProjectModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Icon from '../components/common/Icon';
import { CardGridSkeleton } from '../components/common/Skeleton';
import { deleteProject } from '../services/projectService';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, loading, refetch } = useProjects();
  const { data: counts = {} } = useTaskCounts();
  // Creating, editing and deleting projects is limited to global admins.
  const isAdmin = user?.role === 'admin';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title?: string;
    message?: string;
    processing?: boolean;
    error?: string;
    onConfirm?: () => Promise<void> | void;
  }>({ open: false });

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsEditOpen(true);
  };

  const handleDelete = (project: Project) => {
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
        } catch (e) {
          setConfirm((s) => ({
            ...s,
            processing: false,
            error: getErrorMessage(e, 'Error deleting project'),
          }));
        }
      },
    });
  };

  const loadData = () => refetch();

  const newProjectButton = (label: string) => (
    <button
      onClick={() => setIsCreateOpen(true)}
      className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
    >
      <Icon name="plus" className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500">
            {isAdmin ? 'Manage your projects and teams' : 'The projects you belong to'}
          </p>
        </div>
        {isAdmin && newProjectButton('New Project')}
      </div>

      {loading ? (
        <CardGridSkeleton />
      ) : projects.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <Icon name="folder" className="h-8 w-8" />
          </div>
          <h3 className="mb-2 font-medium text-gray-900">No projects yet</h3>
          <p className="mx-auto mb-6 max-w-md text-gray-500">
            {isAdmin
              ? 'Create your first project to start managing tasks and collaborating with your team.'
              : 'You will see projects here once an admin adds you to one.'}
          </p>
          {isAdmin && newProjectButton('Create First Project')}
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {projects.map((p) => {
              const count = counts[p.id];
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className="cursor-pointer rounded-lg border bg-white p-5 shadow-sm hover:shadow"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Icon name="folder" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {p.key}
                          {count && ` • ${plural(count.total, 'task')} • ${count.assigned_to_me} mine`}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(p);
                          }}
                          className="rounded p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                          title="Edit"
                          aria-label={`Edit ${p.name}`}
                        >
                          <Icon name="pencil" className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p);
                          }}
                          className="rounded p-2 text-red-500 hover:bg-gray-50 hover:text-red-600"
                          title="Delete"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {p.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">{p.description}</p>
                  )}
                  {p.member_count != null && (
                    <div className="mt-4 flex items-center gap-1 text-xs text-gray-500">
                      <Icon name="users" className="h-4 w-4" />
                      <span>{plural(p.member_count, 'member')}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {isAdmin && (
        <>
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
        </>
      )}
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
