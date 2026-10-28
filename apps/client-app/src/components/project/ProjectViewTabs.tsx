export type ProjectView = 'board' | 'list';

const VIEWS: { value: ProjectView; label: string }[] = [
  { value: 'board', label: 'Board' },
  { value: 'list', label: 'List' },
];

interface Props {
  value: ProjectView;
  onChange: (view: ProjectView) => void;
}

export default function ProjectViewTabs({ value, onChange }: Props) {
  return (
    <div role="tablist" aria-label="Project view" className="flex gap-1">
      {VIEWS.map((view) => (
        <button
          key={view.value}
          type="button"
          role="tab"
          aria-selected={value === view.value}
          onClick={() => onChange(view.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            value === view.value
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
