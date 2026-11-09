import { Loader2 } from 'lucide-react';
import { LogoMark } from './Logo';
import { cn } from '../../utils/cn';

export function FullPageLoader({ label = 'Preparing your day…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-light dark:bg-surface-dark">
      <LogoMark className="h-11 w-11 animate-pulse" />
      <div className="flex items-center gap-2 text-sm font-medium text-ink-500 dark:text-ink-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

export function InlineLoader({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-12 text-sm text-ink-500 dark:text-ink-400', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton h-4 w-full', className)} aria-hidden="true" />;
}
