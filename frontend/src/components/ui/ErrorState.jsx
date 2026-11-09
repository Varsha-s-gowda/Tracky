import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Unable to load this view',
  message = 'Something went wrong while connecting to Tracky AI.',
  onRetry,
  className,
}) {
  return (
    <div className={`surface-card flex flex-col items-center px-6 py-12 text-center ${className || ''}`}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-ink-500 dark:text-ink-400">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
