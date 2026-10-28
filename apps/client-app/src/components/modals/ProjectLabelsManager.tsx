import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createLabel,
  deleteLabel,
  type Label,
} from '../../services/labelService';
import {
  projectLabelsQueryKey,
  useProjectLabels,
} from '../../hooks/useTaskDetails';

interface Props {
  projectId: string;
}

export default function ProjectLabelsManager({ projectId }: Props) {
  const queryClient = useQueryClient();
  const { data: labels = [], isLoading } = useProjectLabels(projectId);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: createLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectLabelsQueryKey(projectId),
      });
      setName('');
      setError('');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Could not create label';
      setError(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectLabelsQueryKey(projectId),
      });
      setError('');
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Could not delete label';
      setError(message);
    },
  });

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createMutation.mutateAsync({
      project_id: projectId,
      name: name.trim(),
      color,
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        Labels
      </label>
      {isLoading ? (
        <p className="text-xs text-gray-500">Loading labels...</p>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto rounded border border-gray-200 p-2">
          {labels.length === 0 && (
            <p className="text-xs text-gray-500 py-2 text-center">No labels yet</p>
          )}
          {labels.map((label: Label) => (
            <div
              key={label.id}
              className="flex items-center justify-between rounded px-2 py-1 hover:bg-gray-50"
            >
              <span
                className="inline-flex items-center rounded-full px-2 py-1 text-xs text-white"
                style={{ backgroundColor: label.color || '#6b7280' }}
              >
                {label.name}
              </span>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(label.id)}
                disabled={deleteMutation.isPending}
                className="text-xs text-red-600 hover:underline disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleCreate();
              }
            }}
            placeholder="New label name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="h-10 w-12 rounded border border-gray-300"
        />
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={createMutation.isPending || !name.trim()}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-60"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
