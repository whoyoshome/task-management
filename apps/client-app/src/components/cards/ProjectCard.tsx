import React, { useMemo } from 'react';
import { Project } from '../../hooks/useProjects';

type Props = {
  project: Project;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: React.ReactNode;
};

export default function ProjectCard({ project, onClick, onEdit, onDelete, actions }: Props) {
  const projectKey = useMemo(() => {
    if (project.key) return project.key;
    const words = (project.name || '').trim().split(/\s+/);
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
    return (project.name || 'PRJ').slice(0, 4).toUpperCase();
  }, [project.key, project.name]);

  return (
    <div
      className="rounded-2xl border bg-white p-5 hover:shadow transition cursor-default"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <span aria-hidden>📁</span>
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900 leading-6">{project.name}</h4>
            <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
              <span className="inline-flex items-center gap-1">🏷 <span>{projectKey}</span></span>
              {project.created_at && (
                <span className="inline-flex items-center gap-1">🗓 <time title={new Date(project.created_at).toLocaleString()}>{new Date(project.created_at).toLocaleDateString()}</time></span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <button
            title="Editar"
            className="hover:text-gray-600 transition"
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}
          >
            ✏️
          </button>
          <button
            title="Eliminar"
            className="text-red-500 hover:text-red-600 transition"
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }}
          >
            🗑
          </button>
          {actions}
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
        {project.description || 'Sin descripción'}
      </p>
    </div>
  );
}
