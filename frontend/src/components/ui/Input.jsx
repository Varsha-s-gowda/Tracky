import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

const controlBase =
  'w-full rounded-xl border border-ink-200 bg-white text-sm text-ink-900 shadow-[0_1px_2px_rgba(16,24,40,0.02)] transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400 dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:placeholder:text-ink-500 dark:focus:border-brand-400/70 dark:disabled:bg-white/[0.02]';

function FieldShell({ id, label, hint, error, required, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={id} className="block text-[0.8125rem] font-semibold text-ink-700 dark:text-ink-200">
          {label}
          {required ? <span className="ml-0.5 text-danger-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger-600 dark:text-danger-500" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-400 dark:text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, error, hint, required, className, leftIcon, rightElement, id: providedId, ...props },
  ref
) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-400 dark:text-ink-500">
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={cn(controlBase, 'h-11 px-3.5', leftIcon && 'pl-10', rightElement && 'pr-11')}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {rightElement ? (
          <span className="absolute inset-y-0 right-1.5 flex items-center">{rightElement}</span>
        ) : null}
      </div>
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className, id: providedId, rows = 4, ...props },
  ref
) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cn(controlBase, 'resize-none px-3.5 py-3 leading-6')}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, required, className, children, id: providedId, ...props },
  ref
) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(controlBase, 'h-11 appearance-none pl-3.5 pr-10')}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </FieldShell>
  );
});
