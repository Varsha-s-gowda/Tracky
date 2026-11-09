import { cn } from '../../utils/cn';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-5 text-center',
        compact ? 'py-8' : 'py-14',
        className
      )}
    >
      {Icon ? (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-500 dark:bg-white/[0.06] dark:text-ink-400">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <h3 className="font-display text-[0.95rem] font-bold text-ink-800 dark:text-ink-100">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-ink-500 dark:text-ink-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
