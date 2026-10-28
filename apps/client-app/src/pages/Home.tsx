import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyTasks, useProjects, useTaskCounts, useUsers } from '../hooks';
import type { Task } from '../hooks';
import StatCard, { ICONS } from '../components/dashboard/StatCard';
import RecentProjects from '../components/dashboard/RecentProjects';
import RecentTasks from '../components/dashboard/RecentTasks';
import TaskDetailPanel from '../components/modals/TaskDetailPanel';

export default function Home() {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { users } = useUsers();
  const { data: myTasks = [] } = useMyTasks();
  const { data: counts = {} } = useTaskCounts();
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const taskTotals = useMemo(
    () => Object.fromEntries(Object.values(counts).map((c) => [c.project_id, c.total])),
    [counts]
  );
  const countByStatus = (status: Task['status']) =>
    myTasks.filter((task) => task.status === status).length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Control Panel</h2>
        <p className="text-sm text-gray-500">Summary of your activities and projects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="My Projects" value={projects.length} tone="blue" iconPath={ICONS.folder} />
        <StatCard label="My Tasks" value={myTasks.length} tone="purple" iconPath={ICONS.clipboard} />
        <StatCard
          label="In Progress"
          value={countByStatus('in-progress')}
          tone="yellow"
          iconPath={ICONS.clock}
        />
        <StatCard
          label="Completed"
          value={countByStatus('completed')}
          tone="green"
          iconPath={ICONS.check}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentProjects
          projects={projects}
          taskTotals={taskTotals}
          onOpen={(id) => navigate(`/projects/${id}/board`)}
        />
        <RecentTasks tasks={myTasks} projects={projects} onSelect={setDetailTask} />
      </div>

      <TaskDetailPanel
        task={detailTask}
        users={users}
        isOpen={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
      />
    </div>
  );
}
