import { useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  circle = false,
  id: providedId,
  ...props
}) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <label
      htmlFor={id}
      className={cn(
        'group inline-flex cursor-pointer items-start gap-3',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-all duration-200',
          circle ? 'rounded-full' : 'rounded-[6px]',
          checked
            ? 'border-brand-600 bg-brand-600 text-white shadow-[0_3px_10px_-4px_rgba(103,70,223,0.8)]'
            : 'border-ink-300 bg-white group-hover:border-brand-400 dark:border-white/20 dark:bg-white/[0.03]',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-surface-dark'
        )}
        aria-hidden="true"
      >
        <Check
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-150',
            checked ? 'scale-100' : 'scale-50 opacity-0'
          )}
          strokeWidth={3}
        />
      </span>
      {label || description ? (
        <span className="min-w-0">
          {label ? (
            <span className="block text-sm font-medium text-ink-800 dark:text-ink-100">{label}</span>
          ) : null}
          {description ? (
            <span className="mt-0.5 block text-xs leading-5 text-ink-500 dark:text-ink-400">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}
