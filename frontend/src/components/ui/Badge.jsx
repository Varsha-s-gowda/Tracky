import { cn } from '../../utils/cn';
import { PRIORITY_MAP } from '../../utils/constants';

const VARIANTS = {
  neutral:
    'bg-ink-100 text-ink-600 ring-ink-500/10 dark:bg-white/[0.06] dark:text-ink-300 dark:ring-white/10',
  brand:
    'bg-brand-50 text-brand-700 ring-brand-600/10 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/15',
  success:
    'bg-success-50 text-success-700 ring-success-600/15 dark:bg-success-500/10 dark:text-success-500 dark:ring-success-500/20',
  warning:
    'bg-warning-50 text-warning-700 ring-warning-500/15 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/20',
  danger:
    'bg-danger-50 text-danger-700 ring-danger-500/15 dark:bg-danger-500/10 dark:text-danger-500 dark:ring-danger-500/20',
  outline:
    'bg-transparent text-ink-500 ring-1 ring-inset ring-ink-200 dark:text-ink-400 dark:ring-white/10',
};

export default function Badge({ children, variant = 'neutral', className, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold leading-none ring-1 ring-inset',
        VARIANTS[variant] || VARIANTS.neutral,
        className
      )}
    >
      {dot ? (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success'
              ? 'bg-success-500'
              : variant === 'danger'
                ? 'bg-danger-500'
                : variant === 'warning'
                  ? 'bg-warning-500'
                  : variant === 'brand'
                    ? 'bg-brand-500'
                    : 'bg-ink-400'
          )}
        />
      ) : null}
      {children}
    </span>
  );
}

export function PriorityBadge({ priority, className }) {
  const config = PRIORITY_MAP[priority] || PRIORITY_MAP.medium;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold leading-none ring-1 ring-inset',
        config.badge,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
