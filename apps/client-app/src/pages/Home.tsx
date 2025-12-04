import { useEffect, useMemo, useState } from 'react';
import {
  Link,
  useLocation,
  useSearchParams,
  useNavigate,
} from 'react-router-dom';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import { useAuth, useProjects, useTasks } from '../hooks';
import { t } from '../i18n';
import ProjectCard from '../components/cards/ProjectCard';
import TaskCard from '../components/cards/TaskCard';
import { useUsers } from '../hooks/useUsers';
import EditTaskModal from '../components/modals/EditTaskModal';
import EditProjectModal from '../components/modals/EditProjectModal';
import { deleteTask, getMyTasksByProject } from '../services/taskService';
import { deleteProject } from '../services/projectService';
import ConfirmDialog from '../components/common/ConfirmDialog';

type Tab = 'projects' | 'tasks' | 'team';
type TaskFilter = 'all' | 'to-do' | 'in-progress' | 'completed';

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { projects: myProjects, refetch: refetchProjects } = useProjects();
  const storedSelected = (() =>
    localStorage.getItem('home.selectedProjectId') || undefined)();
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(storedSelected);
  const { tasks, refetch: refetchTasks } = useTasks(selectedProjectId);
  const { users } = useUsers();
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const loadAllTasks = async () => {
      if (!user?.id || !myProjects?.length) {
        setAllTasks([]);
        setTaskCounts({});
        return;
      }

      const allTasksList: any[] = [];
      const counts: Record<string, number> = {};

      for (const p of myProjects) {
        if (cancelled) break;
        try {
          const items = await getMyTasksByProject(p.id, user.id);
          const taskList = Array.isArray(items) ? items : [];
          allTasksList.push(...taskList);
          counts[p.id] = taskList.length;
        } catch {
          counts[p.id] = 0;
        }
      }

      if (!cancelled) {
        setAllTasks(allTasksList);
        setTaskCounts(counts);
      }
    };

    loadAllTasks();
    return () => {
      cancelled = true;
    };
  }, [myProjects, user?.id]);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title?: string;
    message?: string;
    onConfirm?: () => Promise<void> | void;
    processing?: boolean;
    error?: string;
    confirmLabel?: string;
  }>({ open: false });

  const mapTabToEnglish = (value: string | null): Tab | null => {
    if (!value) return null;
    const v = value.toLowerCase();
    if (v === 'proyectos') return 'projects';
    if (v === 'tareas') return 'tasks';
    if (v === 'equipo') return 'team';
    if (v === 'projects' || v === 'tasks' || v === 'team') return v as Tab;
    return null;
  };
  const mapFilterToEnglish = (value: string | null): TaskFilter | null => {
    if (!value) return null;
    const v = value.toLowerCase();
    if (v === 'todas') return 'all';
    if (v === 'por-hacer') return 'to-do';
    if (v === 'en-progreso') return 'in-progress';
    if (v === 'completadas') return 'completed';
    if (
      v === 'all' ||
      v === 'to-do' ||
      v === 'in-progress' ||
      v === 'completed'
    )
      return v as TaskFilter;
    return null;
  };

  const initialTab =
    mapTabToEnglish(searchParams.get('tab')) ||
    mapTabToEnglish(localStorage.getItem('home.activeTab')) ||
    'projects';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const initialFilter =
    mapFilterToEnglish(searchParams.get('filter')) ||
    mapFilterToEnglish(localStorage.getItem('home.taskFilter')) ||
    'all';
  const [taskFilter, setTaskFilter] = useState<TaskFilter>(initialFilter);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [modalDefaults, setModalDefaults] = useState<{
    projectId?: string;
    userId?: string;
  }>({});

  const loadData = () => {
    refetchProjects();
    refetchTasks();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = mapTabToEnglish(params.get('tab'));
    const storedTab = mapTabToEnglish(localStorage.getItem('home.activeTab'));
    const chosenTab: Tab = urlTab || storedTab || 'projects';
    if (chosenTab !== activeTab) setActiveTab(chosenTab);

    const urlFilter = mapFilterToEnglish(params.get('filter'));
    const storedFilter = mapFilterToEnglish(
      localStorage.getItem('home.taskFilter')
    );
    const chosenFilter: TaskFilter = urlFilter || storedFilter || 'all';
    if (chosenFilter !== taskFilter) setTaskFilter(chosenFilter);

    if (chosenTab !== 'tasks') {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.delete('filter');
          return p;
        },
        { replace: true } as any
      );
    }

    localStorage.setItem('home.activeTab', chosenTab);
    if (chosenTab === 'tasks')
      localStorage.setItem('home.taskFilter', chosenFilter);

    const modal = params.get('modal');
    const projectId = params.get('projectId') || undefined;
    const userId = params.get('userId') || undefined;
    if (modal === 'new-project') {
      setIsCreateProjectModalOpen(true);
    } else if (modal === 'new-task') {
      setModalDefaults({ projectId, userId });
      setIsCreateTaskModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!myProjects?.length) return;
    const exists =
      storedSelected && myProjects.some((p: any) => p.id === storedSelected);
    const next = exists
      ? storedSelected
      : selectedProjectId || myProjects[0].id;
    if (next !== selectedProjectId) setSelectedProjectId(next);
    if (next) localStorage.setItem('home.selectedProjectId', next);
  }, [myProjects]);

  useEffect(() => {
    if (selectedProjectId)
      localStorage.setItem('home.selectedProjectId', selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    const p = new URLSearchParams();
    p.set('tab', activeTab);
    if (activeTab === 'tasks') {
      p.set('filter', taskFilter);
    }
    setSearchParams(p, { replace: true } as any);
    localStorage.setItem('home.activeTab', activeTab);
    if (activeTab === 'tasks') {
      localStorage.setItem('home.taskFilter', taskFilter);
    }
  }, [activeTab, taskFilter, setSearchParams]);

  useEffect(() => {
    const urlTab = mapTabToEnglish(searchParams.get('tab'));
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
    const urlFilter = mapFilterToEnglish(searchParams.get('filter'));
    if (urlFilter && urlFilter !== taskFilter) {
      setTaskFilter(urlFilter);
    }
  }, [searchParams]);

  const setTab = (tab: Tab) => {
    setActiveTab(tab);
    const p = new URLSearchParams(searchParams);
    p.set('tab', tab);
    if (tab === 'tasks') {
      p.set('filter', taskFilter);
    } else {
      p.delete('filter');
    }
    setSearchParams(p, { replace: true } as any);
    localStorage.setItem('home.activeTab', tab);
  };

  const setFilter = (filter: TaskFilter) => {
    if (activeTab !== 'tasks') {
      setActiveTab('tasks');
    }
    setTaskFilter(filter);
    const p = new URLSearchParams();
    p.set('tab', 'tasks');
    p.set('filter', filter);
    setSearchParams(p, { replace: true } as any);
    localStorage.setItem('home.taskFilter', filter);
  };

  const allMyTasks = allTasks.filter((t: any) => t.assigned_to === user?.id);
  const completedCount = allMyTasks.filter(
    (t: any) => t.status === 'completed'
  ).length;
  const inProgressCount = allMyTasks.filter(
    (t: any) => t.status === 'in-progress'
  ).length;

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    if (taskFilter === 'to-do')
      return tasks.filter((t) => t.status === 'pending');
    if (taskFilter === 'in-progress')
      return tasks.filter((t) => t.status === 'in-progress');
    if (taskFilter === 'completed')
      return tasks.filter((t) => t.status === 'completed');
    return tasks;
  }, [tasks, taskFilter]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Control Panel</h2>
        <p className="text-sm text-gray-500">
          Summary of your activities and projects
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Projects</p>
              <p className="text-3xl mt-2">{myProjects.length || 0}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Tasks</p>
              <p className="text-3xl mt-2">{allMyTasks.length || 0}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl mt-2">{inProgressCount || 0}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl mt-2">{completedCount}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Projects and Tasks sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="rounded-lg border border-gray-200 bg-white h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Recent Projects
            </h3>
          </div>
          <div className="p-5">
            {myProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No projects yet
              </div>
            ) : (
              <div className="space-y-3">
                {[...myProjects]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at || '').getTime() -
                      new Date(a.created_at || '').getTime()
                  )
                  .slice(0, 5)
                  .map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/projects/${p.id}/board`)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.key || 'PROJ-001'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {taskCounts[p.id] ?? 0} tasks
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="rounded-lg border border-gray-200 bg-white h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              My Recent Tasks
            </h3>
          </div>
          <div className="p-5">
            {allMyTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <svg
                  className="w-16 h-16 text-gray-300 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <p className="text-sm mb-4">No tasks assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...allMyTasks]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at || '').getTime() -
                      new Date(a.created_at || '').getTime()
                  )
                  .slice(0, 5)
                  .map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-center w-5 h-5 mt-0.5 flex-shrink-0">
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
                        <p className="text-sm font-medium text-gray-900">
                          {t.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {myProjects.find((p) => p.id === t.project_id)
                            ?.name || 'Project'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          t.status === 'pending'
                            ? 'bg-gray-100 text-gray-700'
                            : t.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {t.status === 'pending'
                          ? 'To Do'
                          : t.status === 'in-progress'
                          ? 'In Progress'
                          : 'Done'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => {
          setIsCreateProjectModalOpen(false);
          const p = new URLSearchParams(searchParams);
          p.delete('modal');
          setSearchParams(p, { replace: true } as any);
        }}
        onSuccess={loadData}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => {
          setIsCreateTaskModalOpen(false);
          const p = new URLSearchParams(searchParams);
          p.delete('modal');
          p.delete('projectId');
          p.delete('userId');
          setSearchParams(p, { replace: true } as any);
        }}
        onSuccess={loadData}
        defaultProjectId={modalDefaults.projectId}
        defaultAssignedTo={modalDefaults.userId}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={isEditTaskOpen}
        onClose={() => {
          setIsEditTaskOpen(false);
          setSelectedTask(null);
        }}
        onSuccess={loadData}
        task={selectedTask}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => {
          setIsEditProjectOpen(false);
          setSelectedProject(null);
        }}
        onSuccess={loadData}
        project={selectedProject}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel || 'Delete'}
        cancelLabel="Cancel"
        confirmVariant="danger"
        processing={!!confirmState.processing}
        error={confirmState.error}
        onConfirm={() => confirmState.onConfirm && confirmState.onConfirm()}
        onClose={() => setConfirmState({ open: false })}
      />
    </div>
  );
}
