import { cn } from '../../utils/cn';
import Card from '../ui/Card';

export default function StatCard({
  icon: Icon,
  label,
  value,
  note,
  accent = 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300',
  progress,
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            accent
          )}
        >
          <Icon className="h-[17px] w-[17px]" />
        </div>
        {typeof progress === 'number' ? (
          <span className="rounded-full bg-ink-50 px-2 py-1 text-[0.62rem] font-bold text-ink-500 dark:bg-white/[0.05] dark:text-ink-400">
            {progress}%
          </span>
        ) : null}
      </div>
      <p className="mt-4 font-display text-[1.65rem] font-bold leading-none tracking-[-0.045em] text-ink-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1.5 text-[0.8rem] font-semibold text-ink-700 dark:text-ink-200">{label}</p>
      {note ? <p className="mt-0.5 text-[0.68rem] text-ink-400 dark:text-ink-500">{note}</p> : null}
      {typeof progress === 'number' ? (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-700"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </Card>
  );
}
