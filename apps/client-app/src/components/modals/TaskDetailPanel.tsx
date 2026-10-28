import { FormEvent, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task, AppUser } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import {
  useProjectLabels,
  useTaskCommentMutations,
  useTaskDetails,
  useTaskLabelMutations,
  useTaskLabels,
} from '../../hooks/useTaskDetails';
import { taskKey } from '../../utils/taskKey';

interface Props {
  task: Task | null;
  users?: AppUser[];
  isOpen: boolean;
  onClose: () => void;
}

function formatStatus(status?: string) {
  const value = (status || '').toLowerCase();
  if (value === 'pending') return 'To Do';
  if (value === 'in-progress') return 'In Progress';
  if (value === 'completed') return 'Completed';
  if (value === 'blocked') return 'Blocked';
  return status || 'Unknown';
}

export default function TaskDetailPanel({
  task,
  users = [],
  isOpen,
  onClose,
}: Props) {
  const { user } = useAuth();
  const taskId = task?.id;
  const projectId = task?.project_id;

  const { data: details, isLoading } = useTaskDetails(taskId);
  const { data: taskLabels = [] } = useTaskLabels(taskId);
  const { data: projectLabels = [] } = useProjectLabels(projectId);
  const { create: createCommentMutation, remove: deleteCommentMutation } =
    useTaskCommentMutations(taskId);
  const { assign: assignLabelMutation, remove: removeLabelMutation } =
    useTaskLabelMutations(taskId, projectId);

  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  const assignee = useMemo(
    () => users.find((entry) => entry.id === task?.assigned_to),
    [users, task?.assigned_to]
  );

  const comments = details?.comments ?? [];
  const key = taskKey(details?.project?.key, task?.number);
  const assignedLabelIds = new Set(taskLabels.map((label) => label.id));

  const handleAddComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!taskId || !user?.id || !commentText.trim()) return;

    setError('');
    try {
      await createCommentMutation.mutateAsync({
        task_id: taskId,
        user_id: user.id,
        content: commentText.trim(),
      });
      setCommentText('');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Could not add comment';
      setError(message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setError('');
    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Could not delete comment';
      setError(message);
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    setError('');
    try {
      if (assignedLabelIds.has(labelId)) {
        await removeLabelMutation.mutateAsync({ labelId });
      } else {
        await assignLabelMutation.mutateAsync({ labelId });
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Could not update label';
      setError(message);
    }
  };

  const resolveUserName = (userId: string) => {
    const match = users.find((entry) => entry.id === userId);
    return match?.full_name || match?.email || 'Unknown user';
  };

  return (
    <AnimatePresence>
      {isOpen && task && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {task.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {key && <span className="font-medium text-orange-600">{key} · </span>}
                  {formatStatus(task.status)} · Priority {task.priority}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-6 px-6 py-5">
              <section>
                <h3 className="text-sm font-medium text-gray-900">Details</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {task.description || 'No description'}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Assigned to:{' '}
                  {assignee?.full_name || assignee?.email || 'Unassigned'}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-900">Labels</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {projectLabels.length === 0 && (
                    <p className="text-sm text-gray-500">No labels in project</p>
                  )}
                  {projectLabels.map((label) => {
                    const active = assignedLabelIds.has(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => handleToggleLabel(label.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                          active
                            ? 'border-transparent text-white'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        style={
                          active
                            ? {
                                backgroundColor: label.color || '#4b5563',
                              }
                            : undefined
                        }
                      >
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-medium text-gray-900">Comments</h3>
                {isLoading ? (
                  <p className="mt-2 text-sm text-gray-500">Loading comments...</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {comments.length === 0 && (
                      <p className="text-sm text-gray-500">No comments yet</p>
                    )}
                    {comments.map((comment) => {
                      const canDelete =
                        user?.id === comment.user_id || user?.role === 'admin';
                      return (
                        <div
                          key={comment.id}
                          className="rounded-lg border bg-gray-50 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium text-gray-700">
                                {resolveUserName(comment.user_id)}
                              </p>
                              <p className="mt-1 text-sm text-gray-800">
                                {comment.content}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {comment.created_at
                                  ? new Date(comment.created_at).toLocaleString()
                                  : ''}
                              </p>
                            </div>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <form onSubmit={handleAddComment} className="mt-4 space-y-2">
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    rows={3}
                    placeholder="Add a comment..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={createCommentMutation.isPending || !commentText.trim()}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
                  >
                    Add comment
                  </button>
                </form>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
