import React, { useMemo } from 'react';
import { Task } from '../../hooks/useTasks';
import { User } from '../../hooks/useUsers';

type Props = {
  task: Task;
  assignee?: User | null;
  projectName?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
};

function statusBadgeClasses(status?: string) {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'bg-green-50 text-green-700 ring-1 ring-green-200';
  if (s === 'in-progress' || s === 'in_progress') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
  if (s === 'blocked') return 'bg-red-50 text-red-700 ring-1 ring-red-200';
  return 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'; // pending / default
}

function priorityBadgeClasses(priority?: string) {
  const p = (priority || '').toLowerCase();
  if (p === 'high') return 'bg-red-50 text-red-700 ring-1 ring-red-200';
  if (p === 'medium') return 'bg-amber-50 text-amber-800 ring-1 ring-amber-200';
  return 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'; // low/default
}

export default function TaskCard({ task, assignee, projectName, onClick, actions }: Props) {
  const assigneeLabel = useMemo(() => {
    if (!assignee) return 'Unassigned';
    return assignee.full_name || assignee.email || 'User';
  }, [assignee]);

  const dueDate = task.due_date ? new Date(task.due_date) : null;

  return (
    <div
      className="group rounded-xl border bg-white p-4 hover:shadow transition cursor-default"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
            <span aria-hidden>📝</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 leading-6">{task.title || 'Untitled Task'}</h4>
            <div className="mt-1 text-xs text-gray-500 flex flex-wrap items-center gap-2">
              {projectName && <span className="inline-flex items-center gap-1">🏷 <span>{projectName}</span></span>}
              <span className="inline-flex items-center gap-1">🙍 <span>{assigneeLabel}</span></span>
              {dueDate && (
                <span className="inline-flex items-center gap-1">🗓 <time title={dueDate.toLocaleString()}>{dueDate.toLocaleDateString()}</time></span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
              {task.description || 'No description'}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center rounded-full px-2 py-1 ${statusBadgeClasses(task.status)}`}>
                {formatStatus(task.status)}
              </span>
              <span className={`inline-flex items-center rounded-full px-2 py-1 ${priorityBadgeClasses(task.priority)}`}>
                Priority: {formatPriority(task.priority)}
              </span>
            </div>
          </div>
        </div>
        <div className="opacity-70 group-hover:opacity-100 transition">
          {actions}
        </div>
      </div>
    </div>
  );
}

function formatStatus(s?: string) {
  const v = (s || '').toLowerCase();
  if (v === 'pending') return 'To Do';
  if (v === 'in-progress' || v === 'in_progress') return 'In Progress';
  if (v === 'completed') return 'Completed';
  if (v === 'blocked') return 'Blocked';
  return s || 'Unknown';
}

function formatPriority(p?: string) {
  const v = (p || '').toLowerCase();
  if (v === 'high') return 'High';
  if (v === 'medium') return 'Medium';
  if (v === 'low') return 'Low';
  return p || 'Unknown';
}
