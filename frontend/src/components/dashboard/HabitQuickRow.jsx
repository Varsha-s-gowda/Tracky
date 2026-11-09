import { Check } from 'lucide-react';
import Checkbox from '../ui/Checkbox';
import HabitCategoryIcon from '../habits/HabitCategoryIcon';
import { cn } from '../../utils/cn';

export default function HabitQuickRow({ habit, onToggle, busy = false }) {
  const target = habit.target || { value: 1, unit: 'times' };

  return (
    <div className="flex items-center gap-3 border-b border-ink-100/80 px-4 py-3 last:border-b-0 dark:border-white/[0.05] sm:px-5">
      <Checkbox
        circle
        checked={habit.completedToday}
        disabled={busy}
        onChange={() => onToggle(habit)}
        aria-label={
          habit.completedToday
            ? `Mark ${habit.name} incomplete for today`
            : `Complete ${habit.name} for today`
        }
        className={cn(busy && 'animate-pulse')}
      />
      <HabitCategoryIcon category={habit.category} size="sm" />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-[0.82rem] font-semibold',
            habit.completedToday
              ? 'text-ink-400 line-through dark:text-ink-500'
              : 'text-ink-800 dark:text-ink-100'
          )}
        >
          {habit.name}
        </p>
        <p className="mt-0.5 text-[0.66rem] text-ink-400 dark:text-ink-500">
          {target.value} {target.unit} ·{' '}
          {habit.frequency === 'daily' ? 'Every day' : 'Selected days'}
        </p>
      </div>
      {habit.completedToday ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-1 text-[0.6rem] font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-500">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
          Done
        </span>
      ) : null}
    </div>
  );
}
