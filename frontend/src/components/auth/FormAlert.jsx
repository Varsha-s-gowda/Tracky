import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function FormAlert({ type = 'error', children, className }) {
  if (!children) return null;
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-5',
        type === 'success'
          ? 'border-success-500/20 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-500'
          : 'border-danger-500/15 bg-danger-50 text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-500',
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
