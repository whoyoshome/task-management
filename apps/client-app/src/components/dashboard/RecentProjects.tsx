import type { Project } from '../../hooks/useProjects';
import Icon from '../common/Icon';

interface Props {
  projects: Project[];
  /** Total tasks per project id. */
  taskTotals: Record<string, number>;
  onOpen: (projectId: string) => void;
  limit?: number;
}

const newestFirst = (a: Project, b: Project) =>
  new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();

export default function RecentProjects({ projects, taskTotals, onOpen, limit = 5 }: Props) {
  const recent = [...projects].sort(newestFirst).slice(0, limit);

  return (
    <section className="rounded-lg border border-gray-200 bg-white h-full">
      <div className="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Recent Projects</h3>
      </div>
      <div className="p-5">
        {recent.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No projects yet</div>
        ) : (
          <ul className="space-y-3">
            {recent.map((project) => (
              <li
                key={project.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onOpen(project.id)}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon name="folder" className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                  <p className="text-xs text-gray-500">{project.key}</p>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {taskTotals[project.id] ?? 0} tasks
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
