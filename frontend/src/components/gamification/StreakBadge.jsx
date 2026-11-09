import { Flame } from 'lucide-react';
import { cn } from '../../utils/cn';

export function StreakBadge({ count = 0, label, className, size = 'md' }) {
  const active = count > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[0.62rem]' : 'px-2.5 py-1 text-[0.68rem]',
        active
          ? 'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20 dark:bg-warning-500/10 dark:text-warning-500'
          : 'bg-ink-100 text-ink-500 dark:bg-white/[0.06] dark:text-ink-400',
        className
      )}
    >
      <Flame className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5', active && 'text-warning-500')} />
      {count}
      {label ? <span className="font-medium opacity-80">{label}</span> : null}
    </span>
  );
}

export default StreakBadge;
