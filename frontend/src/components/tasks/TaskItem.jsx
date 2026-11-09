import { Clock, Pencil, Repeat2, Trash2 } from 'lucide-react';
import Checkbox from '../ui/Checkbox';
import { PriorityBadge } from '../ui/Badge';
import { RECURRENCE_MAP } from '../../utils/constants';
import { formatTime, isOverdue, relativeDateLabel } from '../../utils/date';
import { cn } from '../../utils/cn';

export default function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  busy = false,
  compact = false,
  showDescription = true,
}) {
  const completed = task.status === 'completed';
  const overdue = isOverdue(task.dueDate, task.dueTime, task.status);
  const dateLabel = relativeDateLabel(task.dueDate);
  const timeLabel = formatTime(task.dueTime);

  return (
    <div
      className={cn(
        'group flex items-start gap-3 border-b border-ink-100/80 px-4 transition-colors last:border-b-0 dark:border-white/[0.05] sm:px-5',
        compact ? 'py-3' : 'py-3.5',
        'hover:bg-ink-50/70 dark:hover:bg-white/[0.018]'
      )}
    >
      <div className="pt-0.5">
        <Checkbox
          circle
          checked={completed}
          disabled={busy}
          onChange={() => onToggle(task)}
          aria-label={completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
          className={cn(busy && 'animate-pulse')}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <p
            className={cn(
              'min-w-0 text-sm font-semibold transition-colors',
              completed
                ? 'text-ink-400 line-through dark:text-ink-500'
                : 'text-ink-800 dark:text-ink-100'
            )}
          >
            {task.title}
          </p>
          <PriorityBadge priority={task.priority} />
          {task.recurrence !== 'none' ? (
            <span
              className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-ink-400 dark:text-ink-500"
              title={RECURRENCE_MAP[task.recurrence]}
            >
              <Repeat2 className="h-3 w-3" />
              <span className="hidden sm:inline">{RECURRENCE_MAP[task.recurrence]}</span>
            </span>
          ) : null}
        </div>

        {showDescription && task.description ? (
          <p
            className={cn(
              'mt-1 line-clamp-2 text-xs leading-5',
              completed ? 'text-ink-400 dark:text-ink-600' : 'text-ink-500 dark:text-ink-400'
            )}
          >
            {task.description}
          </p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-medium text-ink-400 dark:text-ink-500">
          <span
            className={cn(
              'inline-flex items-center gap-1',
              overdue && !completed && 'font-semibold text-danger-600 dark:text-danger-500'
            )}
          >
            <Clock className="h-3 w-3" />
            {dateLabel}
            {timeLabel ? ` · ${timeLabel}` : ''}
          </span>
          {task.category ? (
            <span className="inline-flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-ink-300 dark:bg-ink-600" />
              {task.category}
            </span>
          ) : null}
          {task.tags?.length ? (
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              {task.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-ink-100/80 px-1.5 py-0.5 text-[0.6rem] font-medium text-ink-500 dark:bg-white/[0.05] dark:text-ink-400"
                >
                  #{tag}
                </span>
              ))}
              {task.tags.length > 3 ? (
                <span className="text-[0.6rem]">+{task.tags.length - 3}</span>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="focus-ring rounded-lg p-1.5 text-ink-400 transition hover:bg-white hover:text-ink-700 hover:shadow-sm dark:hover:bg-white/[0.07] dark:hover:text-white"
          aria-label={`Edit ${task.title}`}
          title="Edit task"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="focus-ring rounded-lg p-1.5 text-ink-400 transition hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/10 dark:hover:text-danger-500"
          aria-label={`Delete ${task.title}`}
          title="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
