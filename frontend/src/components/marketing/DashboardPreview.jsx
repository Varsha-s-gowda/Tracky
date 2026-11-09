import {
  CalendarDays,
  Check,
  Circle,
  LayoutDashboard,
  ListTodo,
  Repeat2,
  Settings,
  Sparkles,
} from 'lucide-react';
import { LogoMark } from '../ui/Logo';
import ProgressRing from '../ui/ProgressRing';
import { formatDate, todayKey } from '../../utils/date';

const TASKS = [
  { title: 'Review the product brief', meta: 'Work · 10:00 AM', done: true, priority: 'high' },
  { title: 'Take a 30-minute walk', meta: 'Health · 1:30 PM', done: true, priority: 'medium' },
  { title: 'Draft weekly reflection', meta: 'Personal · 6:00 PM', done: false, priority: 'low' },
];

const HABITS = [
  { name: 'Read 20 pages', done: true },
  { name: 'Practice DSA', done: true },
  { name: 'Drink 8 glasses', done: false },
];

export default function DashboardPreview() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-brand-200/30 blur-2xl dark:bg-brand-600/10"
        aria-hidden="true"
      />
      <div className="overflow-hidden rounded-[1.6rem] border border-white/60 bg-white shadow-[0_40px_100px_-36px_rgba(38,26,84,0.38)] dark:border-white/10 dark:bg-[#12141b]">
        <div className="flex h-9 items-center gap-1.5 border-b border-ink-100 bg-ink-50/70 px-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <span className="h-2 w-2 rounded-full bg-[#ff8a8a]" />
          <span className="h-2 w-2 rounded-full bg-[#f4cf72]" />
          <span className="h-2 w-2 rounded-full bg-[#7ed6ab]" />
          <span className="ml-3 rounded-md bg-white px-2 py-0.5 text-[0.52rem] font-medium text-ink-400 ring-1 ring-ink-100 dark:bg-white/[0.05] dark:text-ink-500 dark:ring-white/[0.06]">
            app.tracky.ai
          </span>
        </div>

        <div className="flex">
          <div className="hidden w-[54px] shrink-0 flex-col items-center border-r border-ink-100 bg-ink-50/50 py-4 dark:border-white/[0.06] dark:bg-white/[0.015] sm:flex">
            <LogoMark className="h-7 w-7 rounded-lg" />
            <div className="mt-6 space-y-2.5">
              {[LayoutDashboard, ListTodo, Repeat2, CalendarDays, Settings].map((Icon, index) => (
                <span
                  key={index}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    index === 0
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300'
                      : 'text-ink-300 dark:text-ink-600'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.56rem] font-bold uppercase tracking-[0.13em] text-brand-600 dark:text-brand-400">
                  Good morning
                </p>
                <p className="mt-0.5 font-display text-sm font-bold tracking-[-0.025em] text-ink-900 dark:text-white">
                  Let's build a good day, Maya.
                </p>
                <p className="mt-0.5 text-[0.58rem] text-ink-400">
                  {formatDate(todayKey(), { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <ProgressRing
                value={72}
                size={52}
                stroke={5}
                label={undefined}
                trackClassName="text-ink-100 dark:text-white/[0.07]"
                indicatorClassName="text-brand-600 dark:text-brand-400"
                className="shrink-0"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Today', value: '6', note: 'tasks' },
                { label: 'Done', value: '4', note: 'on track' },
                { label: 'Habits', value: '2/3', note: 'complete' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-ink-100 bg-white p-2.5 dark:border-white/[0.06] dark:bg-white/[0.025]"
                >
                  <p className="text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-ink-900 dark:text-white">
                    {stat.value}
                    <span className="ml-1 text-[0.52rem] font-medium text-ink-400">{stat.note}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[1.35fr_1fr]">
              <div className="rounded-xl border border-ink-100 p-3 dark:border-white/[0.06]">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[0.62rem] font-bold text-ink-800 dark:text-ink-100">Today's tasks</p>
                  <span className="text-[0.5rem] font-medium text-brand-600 dark:text-brand-400">View all</span>
                </div>
                <div className="space-y-1.5">
                  {TASKS.map((task) => (
                    <div
                      key={task.title}
                      className="flex items-center gap-2 rounded-lg bg-ink-50/60 px-2 py-1.5 dark:bg-white/[0.025]"
                    >
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border ${
                          task.done
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-ink-300 dark:border-white/20'
                        }`}
                      >
                        {task.done ? <Check className="h-2 w-2" strokeWidth={3} /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-[0.56rem] font-semibold ${
                            task.done
                              ? 'text-ink-400 line-through'
                              : 'text-ink-700 dark:text-ink-200'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-[0.47rem] text-ink-400">{task.meta}</p>
                      </div>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          task.priority === 'high'
                            ? 'bg-danger-500'
                            : task.priority === 'medium'
                              ? 'bg-warning-500'
                              : 'bg-sky-500'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-ink-100 p-3 dark:border-white/[0.06]">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[0.62rem] font-bold text-ink-800 dark:text-ink-100">Habits</p>
                  <Sparkles className="h-2.5 w-2.5 text-brand-500" />
                </div>
                <div className="space-y-1.5">
                  {HABITS.map((habit) => (
                    <div key={habit.name} className="flex items-center gap-2">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          habit.done
                            ? 'border-success-500 bg-success-500 text-white'
                            : 'border-ink-200 text-transparent dark:border-white/15'
                        }`}
                      >
                        <Check className="h-2 w-2" strokeWidth={3} />
                      </span>
                      <span
                        className={`text-[0.53rem] font-medium ${
                          habit.done ? 'text-ink-400' : 'text-ink-600 dark:text-ink-300'
                        }`}
                      >
                        {habit.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-success-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 hidden items-center gap-2.5 rounded-2xl border border-ink-100 bg-white px-3.5 py-2.5 shadow-card dark:border-white/10 dark:bg-[#191b24] sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <span>
          <span className="block text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink-400">
            Daily rhythm
          </span>
          <span className="block text-[0.6rem] font-semibold text-ink-800 dark:text-ink-100">
            Small wins add up.
          </span>
        </span>
      </div>

      <div className="absolute -right-3 top-16 hidden items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2 shadow-card dark:border-white/10 dark:bg-[#191b24] lg:flex">
        <Circle className="h-2 w-2 fill-brand-500 text-brand-500" />
        <span className="text-[0.55rem] font-semibold text-ink-600 dark:text-ink-300">
          Habits, in one view
        </span>
      </div>
    </div>
  );
}
