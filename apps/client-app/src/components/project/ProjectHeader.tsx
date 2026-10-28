import { Link } from 'react-router-dom';
import type { ProjectMember } from '../../hooks';

const MAX_AVATARS = 5;

const initials = (member: ProjectMember) =>
  (member.full_name || member.email || '?')
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

interface Props {
  project?: { name: string; key?: string; description?: string | null };
  members: ProjectMember[];
  canCreateTasks: boolean;
  canManageMembers: boolean;
  onNewTask: () => void;
  onManageMembers: () => void;
}

export default function ProjectHeader({
  project,
  members,
  canCreateTasks,
  canManageMembers,
  onNewTask,
  onManageMembers,
}: Props) {
  const shown = members.slice(0, MAX_AVATARS);
  const hidden = members.length - shown.length;

  return (
    <div className="mb-6">
      <Link to="/projects" className="text-sm text-gray-500 hover:text-gray-900">
        ← Projects
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              {project?.name ?? 'Project'}
            </h2>
            {project?.key && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {project.key}
              </span>
            )}
          </div>
          {project?.description && (
            <p className="mt-1 text-sm text-gray-500">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div
            className="flex -space-x-2"
            aria-label={`${members.length} ${members.length === 1 ? 'member' : 'members'}`}
          >
            {shown.map((member) => (
              <span
                key={member.user_id}
                title={`${member.full_name || member.email} (${member.role})`}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium text-gray-700"
              >
                {initials(member)}
              </span>
            ))}
            {hidden > 0 && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs text-gray-600">
                +{hidden}
              </span>
            )}
          </div>
          {canManageMembers && (
            <button
              type="button"
              onClick={onManageMembers}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Manage members
            </button>
          )}
          {canCreateTasks && (
            <button
              type="button"
              onClick={onNewTask}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + New task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
