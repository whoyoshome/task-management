import React from 'react';

interface ErrorDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string | React.ReactNode;
  actionLabel?: string;
  onClose: () => void;
}

export default function ErrorDialog({
  isOpen,
  title = 'Action not allowed',
  message = 'You do not have permission to perform this action.',
  actionLabel = 'OK',
  onClose,
}: ErrorDialogProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 text-sm font-bold">!</span>
          {title}
        </h3>
        <div className="mt-3 text-sm text-gray-600">{message}</div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
