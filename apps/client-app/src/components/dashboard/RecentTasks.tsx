import type { Project } from '../../hooks/useProjects';
import type { Task } from '../../hooks/useTasks';
import { TaskDoneIcon, TaskStatusBadge } from '../tasks/TaskStatus';
import { ICONS } from './StatCard';

interface Props {
  tasks: Task[];
  projects: Project[];
  onSelect: (task: Task) => void;
  limit?: number;
}

const newestFirst = (a: Task, b: Task) =>
  new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();

export default function RecentTasks({ tasks, projects, onSelect, limit = 5 }: Props) {
  const recent = [...tasks].sort(newestFirst).slice(0, limit);
  const projectName = (id: string) =>
    projects.find((p) => p.id === id)?.name || 'Project';

  return (
    <section className="rounded-lg border border-gray-200 bg-white h-full">
      <div className="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">My Recent Tasks</h3>
      </div>
      <div className="p-5">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.clipboard} />
            </svg>
            <p className="text-sm mb-4">No tasks assigned yet</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {recent.map((task) => (
              <li
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelect(task)}
              >
                <div className="flex items-center justify-center w-5 h-5 mt-0.5 flex-shrink-0">
                  <TaskDoneIcon done={task.status === 'completed'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{projectName(task.project_id)}</p>
                </div>
                <TaskStatusBadge status={task.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
