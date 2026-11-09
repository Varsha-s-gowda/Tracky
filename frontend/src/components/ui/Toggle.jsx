import { cn } from '../../utils/cn';

export default function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  id,
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {label ? (
          <label
            htmlFor={id}
            className="block text-sm font-semibold text-ink-800 dark:text-ink-100"
          >
            {label}
          </label>
        ) : null}
        {description ? (
          <p className="mt-0.5 text-xs leading-5 text-ink-500 dark:text-ink-400">{description}</p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'focus-ring relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-brand-600 dark:bg-brand-500' : 'bg-ink-300 dark:bg-white/15'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
