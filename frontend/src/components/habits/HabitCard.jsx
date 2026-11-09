import { CheckCircle2, Coffee, Pencil, Repeat2, RotateCcw, Target, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import HabitCategoryIcon from './HabitCategoryIcon';
import { formatWeekdays } from '../../utils/date';
import { cn } from '../../utils/cn';

export default function HabitCard({ habit, onToggle, onEdit, onDelete, busy = false }) {
  const completed = habit.completedToday;
  const scheduled = habit.scheduledToday;
  const target = habit.target || { value: 1, unit: 'times' };

  return (
    <article
      className={cn(
        'group surface-card flex flex-col p-5 transition duration-200',
        completed
          ? 'border-success-500/25 bg-success-50/30 dark:border-success-500/15 dark:bg-success-500/[0.035]'
          : 'hover:border-ink-300/70 dark:hover:border-white/[0.12]'
      )}
    >
      <div className="flex items-start gap-3">
        <HabitCategoryIcon category={habit.category} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                {habit.name}
              </h3>
              <p className="mt-0.5 text-[0.68rem] font-medium text-ink-400 dark:text-ink-500">
                {habit.category}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => onEdit(habit)}
                className="focus-ring rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/[0.07] dark:hover:text-white"
                aria-label={`Edit ${habit.name}`}
                title="Edit habit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(habit)}
                className="focus-ring rounded-lg p-1.5 text-ink-400 transition hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/10 dark:hover:text-danger-500"
                aria-label={`Delete ${habit.name}`}
                title="Delete habit"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {habit.description ? (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink-500 dark:text-ink-400">
          {habit.description}
        </p>
      ) : null}

      <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[0.65rem] font-medium text-ink-500 dark:text-ink-400">
        <span className="inline-flex items-center gap-1 rounded-md bg-ink-100/70 px-2 py-1 dark:bg-white/[0.05]">
          <Repeat2 className="h-3 w-3" />
          {habit.frequency === 'daily' ? 'Daily' : formatWeekdays(habit.daysOfWeek)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-ink-100/70 px-2 py-1 dark:bg-white/[0.05]">
          <Target className="h-3 w-3" />
          {target.value} {target.unit}
        </span>
      </div>

      <div className="mt-auto pt-5">
        {scheduled ? (
          completed ? (
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-700 dark:text-success-500">
                <CheckCircle2 className="h-4 w-4" />
                Completed today
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onToggle(habit)}
                disabled={busy}
                loading={busy}
                leftIcon={<RotateCcw className="h-3 w-3" />}
              >
                Undo
              </Button>
            </div>
          ) : (
            <Button
              variant="subtle"
              size="sm"
              className="w-full"
              onClick={() => onToggle(habit)}
              disabled={busy}
              loading={busy}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Mark complete
            </Button>
          )
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-ink-400 dark:text-ink-500">
            <Coffee className="h-3.5 w-3.5" />
            Rest day — not scheduled today
          </div>
        )}
      </div>
    </article>
  );
}
