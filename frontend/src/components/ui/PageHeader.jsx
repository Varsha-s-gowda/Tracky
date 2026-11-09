import { cn } from '../../utils/cn';

export default function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-bold tracking-[-0.035em] text-ink-900 dark:text-white sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-500 dark:text-ink-400">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
