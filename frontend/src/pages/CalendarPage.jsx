import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Plus,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ErrorState from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Loaders';
import HabitCategoryIcon from '../components/habits/HabitCategoryIcon';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { calendarService } from '../services/calendarService';
import {
  addMonths,
  dateKeyFromValue,
  formatDate,
  formatFullDate,
  formatMonthYear,
  formatTime,
  getCalendarMatrix,
  isoDateFromDate,
  monthKey,
  parseDateKey,
  todayKey,
} from '../utils/date';
import { PRIORITY_MAP } from '../utils/constants';
import { getErrorMessage } from '../utils/errors';
import { cn } from '../utils/cn';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function CalendarSkeleton() {
  return (
    <div className="page-container">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
        <Card className="p-5">
          <Skeleton className="h-10 w-56" />
          <div className="mt-6 grid grid-cols-7 gap-2">
            {Array.from({ length: 42 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        </Card>
        <Card className="h-96 p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-5 h-24 w-full" />
        </Card>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  usePageTitle('Calendar');
  const { user } = useAuth();
  const timeZone = user?.timezone;
  const userToday = todayKey(timeZone);
  const initialDate = parseDateKey(userToday);
  const [cursor, setCursor] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [selectedKey, setSelectedKey] = useState(userToday);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    calendarService
      .getMonth(monthKey(cursor))
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (active) {
          setError(getErrorMessage(requestError, 'We could not load your calendar.'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setHasLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [cursor]);

  const calendarDays = useMemo(
    () => getCalendarMatrix(cursor.getFullYear(), cursor.getMonth(), 1),
    [cursor]
  );

  const tasksByDate = useMemo(() => {
    const map = {};
    (data?.tasks || []).forEach((task) => {
      const key = dateKeyFromValue(task.dueDate);
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [data]);

  const logsByDate = useMemo(() => {
    const map = {};
    (data?.habitLogs || []).forEach((log) => {
      const key = dateKeyFromValue(log.date);
      if (!map[key]) map[key] = [];
      map[key].push(log);
    });
    return map;
  }, [data]);

  const selectedTasks = tasksByDate[selectedKey] || [];
  const selectedLogs = logsByDate[selectedKey] || [];

  const goToPreviousMonth = () => {
    const next = addMonths(cursor, -1);
    setCursor(next);
    setSelectedKey(isoDateFromDate(next));
  };

  const goToNextMonth = () => {
    const next = addMonths(cursor, 1);
    setCursor(next);
    setSelectedKey(isoDateFromDate(next));
  };

  const goToToday = () => {
    const today = parseDateKey(todayKey(timeZone));
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedKey(isoDateFromDate(today));
  };

  const selectDay = (day) => {
    setSelectedKey(day.key);
    if (!day.inMonth) {
      const date = parseDateKey(day.key);
      setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  if (loading && !hasLoaded) return <CalendarSkeleton />;

  if (error && !data) {
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={() => setCursor(new Date(cursor))} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="See the whole picture"
        title="Calendar"
        description="Your scheduled and completed tasks, alongside the habits you followed through on each day."
        actions={
          <Button
            as={Link}
            to="/tasks"
            variant="outline"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Manage tasks
          </Button>
        }
      />

      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,0.85fr)]">
        <Card className={cn('overflow-hidden transition-opacity', loading && 'opacity-70')}>
          <div className="flex flex-col gap-3 border-b border-ink-100 px-4 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="font-display text-[1.05rem] font-bold text-ink-900 dark:text-white">
                {formatMonthYear(cursor)}
              </h2>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                {data?.summary
                  ? `${data.summary.totalTasks} tasks · ${data.summary.completedTasks} completed · ${data.summary.habitCompletions} habit check-ins`
                  : 'Your month at a glance'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                aria-label="Next month"
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50/50 dark:border-white/[0.06] dark:bg-white/[0.02]">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="px-2 py-2 text-center text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-400 dark:text-ink-500"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayTasks = tasksByDate[day.key] || [];
              const dayLogs = logsByDate[day.key] || [];
              const selected = selectedKey === day.key;
              const isUserToday = day.key === userToday;

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    'relative min-h-[76px] border-b border-r border-ink-100 p-1.5 text-left transition-colors sm:min-h-[104px] sm:p-2 dark:border-white/[0.05]',
                    !day.inMonth && 'bg-ink-50/40 text-ink-300 dark:bg-white/[0.012] dark:text-ink-600',
                    day.inMonth && 'hover:bg-brand-50/40 dark:hover:bg-brand-400/[0.035]',
                    index % 7 === 6 && 'border-r-0',
                    index >= 35 && 'border-b-0',
                    selected && 'bg-brand-50/60 ring-2 ring-inset ring-brand-500/70 dark:bg-brand-400/[0.05]'
                  )}
                  aria-label={`${formatFullDate(day.key)} — ${dayTasks.length} tasks, ${dayLogs.length} habits`}
                  aria-pressed={selected}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[0.7rem] font-semibold',
                        isUserToday
                          ? 'bg-brand-600 text-white'
                          : day.inMonth
                            ? 'text-ink-700 dark:text-ink-200'
                            : 'text-ink-300 dark:text-ink-600'
                      )}
                    >
                      {day.day}
                    </span>
                    {dayTasks.length + dayLogs.length > 0 ? (
                      <span className="text-[0.55rem] font-semibold text-ink-400 dark:text-ink-500">
                        {dayTasks.length + dayLogs.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1.5 hidden space-y-1 sm:block">
                    {dayTasks.slice(0, 2).map((task) => {
                      const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
                      return (
                        <div
                          key={task._id}
                          className={cn(
                            'flex items-center gap-1 truncate rounded-md px-1 py-0.5 text-[0.58rem] font-medium',
                            task.status === 'completed'
                              ? 'bg-ink-50 text-ink-400 line-through dark:bg-white/[0.025] dark:text-ink-600'
                              : 'bg-brand-50/70 text-ink-600 dark:bg-white/[0.04] dark:text-ink-300'
                          )}
                        >
                          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', priority.dot)} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}
                    {dayTasks.length > 2 ? (
                      <p className="px-1 text-[0.55rem] font-medium text-ink-400">
                        +{dayTasks.length - 2} more
                      </p>
                    ) : null}
                    {dayLogs.length ? (
                      <div className="flex items-center gap-1 rounded-md bg-success-50/80 px-1 py-0.5 text-[0.55rem] font-semibold text-success-700 dark:bg-success-500/[0.08] dark:text-success-500">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {dayLogs.length} habit{dayLogs.length > 1 ? 's' : ''}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-2 flex items-center gap-1 sm:hidden">
                    {dayTasks.slice(0, 3).map((task) => {
                      const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
                      return (
                        <span
                          key={task._id}
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            task.status === 'completed' ? 'bg-ink-300 dark:bg-ink-600' : priority.dot
                          )}
                        />
                      );
                    })}
                    {dayLogs.length ? (
                      <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-success-500" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="h-fit xl:sticky xl:top-[92px]">
          <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-500" />
              <h2 className="font-display text-[0.95rem] font-bold text-ink-900 dark:text-white">
                {formatFullDate(selectedKey, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
              {selectedTasks.length + selectedLogs.length
                ? `${selectedTasks.length} tasks · ${selectedLogs.length} habits completed`
                : 'A quiet day on the calendar.'}
            </p>
          </div>

          <div className="p-5">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-ink-400 dark:text-ink-500">
                  Tasks
                </h3>
                <span className="text-[0.65rem] font-medium text-ink-400">{selectedTasks.length}</span>
              </div>
              {selectedTasks.length ? (
                <div className="space-y-2.5">
                  {selectedTasks.map((task) => (
                    <div key={task._id} className="flex items-start gap-2.5">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-300 dark:text-ink-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-xs font-semibold leading-5',
                            task.status === 'completed'
                              ? 'text-ink-400 line-through dark:text-ink-500'
                              : 'text-ink-700 dark:text-ink-200'
                          )}
                        >
                          {task.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.62rem] text-ink-400 dark:text-ink-500">
                          {task.dueTime ? <span>{formatTime(task.dueTime)}</span> : <span>All day</span>}
                          <span>· {task.category}</span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 capitalize',
                              task.priority === 'high'
                                ? 'text-danger-600 dark:text-danger-500'
                                : task.priority === 'medium'
                                  ? 'text-warning-600 dark:text-warning-500'
                                  : 'text-sky-600 dark:text-sky-400'
                            )}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs leading-5 text-ink-400 dark:text-ink-500">
                  No tasks scheduled for this date.
                </p>
              )}
            </section>

            <div className="my-5 h-px bg-ink-100 dark:bg-white/[0.06]" />

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-ink-400 dark:text-ink-500">
                  Habits completed
                </h3>
                <span className="text-[0.65rem] font-medium text-ink-400">{selectedLogs.length}</span>
              </div>
              {selectedLogs.length ? (
                <div className="space-y-3">
                  {selectedLogs.map((log) => (
                    <div key={log._id} className="flex items-center gap-2.5">
                      <HabitCategoryIcon category={log.habitId?.category} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink-700 dark:text-ink-200">
                          {log.habitId?.name || 'Habit'}
                        </p>
                        <p className="mt-0.5 text-[0.62rem] text-ink-400 dark:text-ink-500">
                          {log.habitId?.category || 'Completed'}
                        </p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs leading-5 text-ink-400 dark:text-ink-500">
                  No habit completions recorded.
                </p>
              )}
            </section>

            {!selectedTasks.length && !selectedLogs.length ? (
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-50/70 p-3 text-[0.7rem] leading-5 text-brand-800/80 dark:bg-brand-400/[0.06] dark:text-brand-200/70">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                A blank date is not a lost day. It is space to plan or simply rest.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
