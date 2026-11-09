import { Repeat2 } from 'lucide-react';
import { PriorityBadge } from '../ui/Badge';
import { formatDate, formatTime, relativeDateLabel } from '../../utils/date';

export default function UpcomingTaskRow({ task }) {
  return (
    <div className="flex items-start gap-3 border-b border-ink-100/80 px-4 py-3 last:border-b-0 dark:border-white/[0.05] sm:px-5">
      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-ink-100 bg-ink-50/60 dark:border-white/[0.06] dark:bg-white/[0.025]">
        <span className="text-[0.55rem] font-bold uppercase tracking-[0.08em] text-ink-400">
          {formatDate(task.dueDate, { weekday: 'short' })}
        </span>
        <span className="text-[0.78rem] font-bold leading-tight text-ink-800 dark:text-ink-100">
          {formatDate(task.dueDate, { day: 'numeric' })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.82rem] font-semibold text-ink-800 dark:text-ink-100">
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.65rem] text-ink-400 dark:text-ink-500">
          <span>{relativeDateLabel(task.dueDate)}</span>
          {task.dueTime ? <span>· {formatTime(task.dueTime)}</span> : null}
          {task.recurrence !== 'none' ? <Repeat2 className="h-3 w-3" /> : null}
        </div>
      </div>
      <PriorityBadge priority={task.priority} className="hidden shrink-0 sm:inline-flex" />
    </div>
  );
}
