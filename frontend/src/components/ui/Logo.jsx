import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-brand-600 text-white shadow-[0_6px_18px_-8px_rgba(103,70,223,0.9)]',
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" fill="none" className="h-[62%] w-[62%]">
        <path
          d="M7.5 16.5 13 22 25 9.5"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute right-[18%] top-[16%] h-[13%] w-[13%] rounded-full bg-brand-200" />
    </span>
  );
}

export default function Logo({ to = '/', className, onDark = false, showBadge = true }) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'font-display text-[1.18rem] font-extrabold tracking-[-0.035em]',
            onDark ? 'text-white' : 'text-ink-900 dark:text-white'
          )}
        >
          Tracky
        </span>
        {showBadge ? (
          <span
            className={cn(
              'translate-y-[-1px] rounded-md px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em]',
              onDark
                ? 'bg-white/10 text-brand-100 ring-1 ring-inset ring-white/10'
                : 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/10 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/10'
            )}
          >
            AI
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} className="focus-ring inline-flex rounded-xl" aria-label="Tracky AI home">
      {content}
    </Link>
  );
}
