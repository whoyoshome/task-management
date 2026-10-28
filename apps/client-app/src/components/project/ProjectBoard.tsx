import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import type { Board, BoardColumn } from '../../services/boardService';
import type { Task } from '../../hooks';
import { taskKey } from '../../utils/taskKey';

const COLUMN_STYLES: Record<
  string,
  { title: string; icon: string; bg: string; titleColor: string; countColor: string }
> = {
  pending: { title: 'To Do', icon: '○', bg: 'bg-gray-50', titleColor: 'text-gray-700', countColor: 'text-gray-500' },
  'in-progress': { title: 'In Progress', icon: '◐', bg: 'bg-blue-50', titleColor: 'text-blue-700', countColor: 'text-blue-600' },
  completed: { title: 'Completed', icon: '✓', bg: 'bg-green-50', titleColor: 'text-green-700', countColor: 'text-green-600' },
};

/** Status transitions offered on a card, in display order. */
const TRANSITIONS: Partial<
  Record<Task['status'], { to: Task['status']; label: string; primary?: boolean }[]>
> = {
  pending: [{ to: 'in-progress', label: 'Start' }],
  'in-progress': [
    { to: 'pending', label: 'Back' },
    { to: 'completed', label: 'Complete', primary: true },
  ],
  completed: [{ to: 'in-progress', label: 'Reopen' }],
};

/**
 * The status a dropped task moves to: the column it was dropped on, or null
 * when it was dropped outside a column or back on its own.
 */
export function dropTarget(
  task: Task | undefined,
  overId: UniqueIdentifier | undefined | null
): Task['status'] | null {
  if (!task || overId == null) return null;
  const status = String(overId) as Task['status'];
  return status === task.status ? null : status;
}

interface Props {
  board: Board;
  tasks: Task[];
  projectKey?: string;
  memberName: (userId: string) => string;
  /** Members and admins may create and move tasks; viewers only look. */
  canEdit: boolean;
  onOpen: (task: Task) => void;
  onMove: (task: Task, status: Task['status']) => void;
  onCreateIn: (status: Task['status']) => void;
}

export default function ProjectBoard({
  board,
  tasks,
  projectKey,
  memberName,
  canEdit,
  onOpen,
  onMove,
  onCreateIn,
}: Props) {
  const [dragged, setDragged] = useState<Task | null>(null);
  // A short move is needed to start a drag, so a plain click still opens
  // the task; the keyboard sensor makes cards movable without a mouse.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const columns = useMemo(
    () =>
      [...(board.columns ?? [])].sort(
        (a: BoardColumn, b: BoardColumn) => a.order_index - b.order_index
      ),
    [board]
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) (map[task.status] ??= []).push(task);
    return map;
  }, [tasks]);

  const onDragStart = ({ active }: DragStartEvent) =>
    setDragged(tasks.find((t) => t.id === active.id) ?? null);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragged(null);
    const task = tasks.find((t) => t.id === active.id);
    const status = dropTarget(task, over?.id);
    if (task && status) onMove(task, status);
  };

  const cardProps = { projectKey, memberName, canEdit, onOpen, onMove };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragged(null)}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.status] ?? []}
            canEdit={canEdit}
            onCreateIn={onCreateIn}
          >
            {(tasksByStatus[column.status] ?? []).map((task) => (
              <DraggableCard key={task.id} task={task} {...cardProps} />
            ))}
          </Column>
        ))}
      </div>
      <DragOverlay>
        {dragged && (
          <TaskCard task={dragged} {...cardProps} canEdit={false} className="rotate-2 shadow-lg" />
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  column,
  tasks,
  canEdit,
  onCreateIn,
  children,
}: {
  column: BoardColumn;
  tasks: Task[];
  canEdit: boolean;
  onCreateIn: (status: Task['status']) => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status, disabled: !canEdit });
  const style = COLUMN_STYLES[column.status] ?? COLUMN_STYLES.pending;
  const title = COLUMN_STYLES[column.status]?.title ?? column.status;

  return (
    <section aria-label={title} className="flex flex-col">
      <div className={`rounded-t-lg border border-b-0 px-4 py-3 ${style.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xl ${style.titleColor}`}>{style.icon}</span>
            <h3 className={`font-medium ${style.titleColor}`}>{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {column.wip_limit != null ? (
              // Soft WIP limit, as in Jira: flagged, never blocking.
              <span
                className={`text-sm font-medium ${
                  column.over_wip_limit
                    ? 'rounded bg-red-100 px-2 py-0.5 text-red-700'
                    : style.countColor
                }`}
                title={
                  column.over_wip_limit
                    ? `Over the WIP limit of ${column.wip_limit}`
                    : `WIP limit: ${column.wip_limit}`
                }
              >
                {column.task_count ?? tasks.length}/{column.wip_limit}
              </span>
            ) : (
              <span className={`text-sm ${style.countColor}`}>
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            )}
            {canEdit && (
              <button
                type="button"
                aria-label={`Add task to ${title}`}
                title={`Add task to ${title}`}
                onClick={() => onCreateIn(column.status)}
                className={`rounded px-1.5 text-lg leading-none hover:bg-white ${style.titleColor}`}
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[300px] flex-1 rounded-b-lg border border-t-0 p-3 transition-colors ${
          isOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-300' : 'bg-white'
        }`}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <p className="text-sm">{canEdit ? 'Drop tasks here' : 'No tasks'}</p>
          </div>
        ) : (
          <div className="space-y-3">{children}</div>
        )}
      </div>
    </section>
  );
}

type CardProps = {
  task: Task;
  projectKey?: string;
  memberName: (userId: string) => string;
  canEdit: boolean;
  onOpen: (task: Task) => void;
  onMove: (task: Task, status: Task['status']) => void;
};

function DraggableCard(props: CardProps) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: props.task.id,
    disabled: !props.canEdit,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      // The overlay follows the pointer; the card stays as a placeholder.
      className={isDragging ? 'opacity-40' : undefined}
    >
      <TaskCard {...props} />
    </div>
  );
}

function TaskCard({
  task,
  projectKey,
  memberName,
  canEdit,
  onOpen,
  onMove,
  className = '',
}: CardProps & { className?: string }) {
  const key = taskKey(projectKey, task.number);
  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm hover:shadow ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${className}`}
      onClick={() => onOpen(task)}
    >
      {key && <div className="mb-1 text-xs font-medium text-orange-600">{key}</div>}
      <div className="text-sm font-medium text-gray-900">{task.title}</div>
      <div className="mt-1 text-xs text-gray-500">
        Assigned to: {memberName(task.assigned_to)}
      </div>
      {canEdit && (
        // Buttons stay as the alternative to dragging (touch, keyboard).
        <div
          className="mt-3 flex gap-2"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {(TRANSITIONS[task.status] ?? []).map((t) => (
            <button
              key={t.to}
              type="button"
              onClick={() => onMove(task, t.to)}
              className={`rounded px-3 py-1.5 text-xs ${
                t.primary ? 'bg-green-600 text-white' : 'border border-gray-300 bg-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
