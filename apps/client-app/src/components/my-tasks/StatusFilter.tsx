import type { Task, TaskStatus } from '../../hooks/useTasks';

export type StatusFilterValue = 'all' | Extract<TaskStatus, 'pending' | 'in-progress' | 'completed'>;

const FILTERS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export const matchesStatus = (task: Task, filter: StatusFilterValue) =>
  filter === 'all' || task.status === filter;

export function StatusFilterTabs({
  value,
  onChange,
}: {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}) {
  return (
    <div className="flex items-center gap-2" role="tablist">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          role="tab"
          aria-selected={value === filter.value}
          onClick={() => onChange(filter.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            value === filter.value
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

const SUMMARY: { status: TaskStatus; label: string; dot: string; ring: string }[] = [
  { status: 'pending', label: 'To Do', dot: 'bg-gray-600', ring: 'bg-gray-100' },
  { status: 'in-progress', label: 'In Progress', dot: 'bg-blue-600', ring: 'bg-blue-100' },
  { status: 'completed', label: 'Completed', dot: 'bg-green-600', ring: 'bg-green-100' },
];

/** One card per status with the number of tasks in it. */
export function StatusSummary({ tasks }: { tasks: Task[] }) {
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {SUMMARY.map(({ status, label, dot, ring }) => (
        <div key={status} className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">{label}</p>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ring}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900">
            {tasks.filter((task) => task.status === status).length}
          </p>
        </div>
      ))}
    </div>
  );
}
