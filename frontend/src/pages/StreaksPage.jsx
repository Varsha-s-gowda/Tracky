import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  History,
  Medal,
  Repeat2,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Modal from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Loaders';
import HabitCategoryIcon from '../components/habits/HabitCategoryIcon';
import { StreakBadge } from '../components/gamification/StreakBadge';
import { usePageTitle } from '../hooks/usePageTitle';
import { streakService } from '../services/streakService';
import {
  addMonths,
  formatDate,
  formatFullDate,
  formatMonthYear,
  formatWeekdays,
  monthKey,
  parseDateKey,
  todayKey,
} from '../utils/date';
import { getErrorMessage } from '../utils/errors';
import { cn } from '../utils/cn';

const STATUS_STYLES = {
  success: {
    cell: 'bg-success-500 text-white hover:bg-success-600',
    dot: 'bg-success-500',
    label: 'Target met',
  },
  completed: {
    cell: 'bg-success-500 text-white hover:bg-success-600',
    dot: 'bg-success-500',
    label: 'Completed',
  },
  missed: {
    cell: 'bg-danger-50 text-danger-600 ring-1 ring-inset ring-danger-500/15 hover:bg-danger-100 dark:bg-danger-500/10 dark:text-danger-500 dark:ring-danger-500/20',
    dot: 'bg-danger-500',
    label: 'Missed',
  },
  pending: {
    cell: 'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20 dark:bg-warning-500/10 dark:text-warning-500',
    dot: 'bg-warning-500',
    label: 'Pending today',
  },
  rest: {
    cell: 'bg-ink-50 text-ink-400 dark:bg-white/[0.025] dark:text-ink-500',
    dot: 'bg-ink-300 dark:bg-ink-600',
    label: 'Rest day',
  },
  upcoming: {
    cell: 'border border-dashed border-ink-200/80 text-ink-300 dark:border-white/[0.07] dark:text-ink-600',
    dot: 'bg-ink-200 dark:bg-ink-700',
    label: 'Upcoming',
  },
};

function statusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.rest;
}

function buildMonthGrid(days = []) {
  if (!days.length) return [];
  const first = parseDateKey(days[0].date);
  const offset = first ? (first.getDay() + 6) % 7 : 0;
  const cells = [...Array.from({ length: offset }, () => null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function addMonthKey(value, amount) {
  return monthKey(addMonths(parseDateKey(`${value}-01`), amount));
}

function StatTile({ icon: Icon, label, value, note, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink-400 dark:text-ink-500">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.04em] text-ink-900 dark:text-white">
            {value}
          </p>
          {note ? <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{note}</p> : null}
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}

function MonthGrid({ days = [], today, onSelect, selectedDate }) {
  const cells = useMemo(() => buildMonthGrid(days), [days]);
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (!days.length) {
    return <p className="py-10 text-center text-sm text-ink-500 dark:text-ink-400">No days in this month.</p>;
  }

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {labels.map((label) => (
          <span
            key={label}
            className="text-center text-[0.58rem] font-bold uppercase tracking-[0.08em] text-ink-400 dark:text-ink-500"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} className="aspect-square" />;
          const style = statusStyle(day.status);
          const isToday = day.date === today;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelect?.(day)}
              title={`${formatFullDate(day.date)} · ${style.label}${
                day.hasActivity && typeof day.score === 'number' ? ` · ${day.score}/100` : ''
              }`}
              aria-label={`${formatFullDate(day.date)}, ${style.label}`}
              className={cn(
                'focus-ring relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-bold transition',
                style.cell,
                isToday && 'ring-2 ring-brand-600 ring-offset-1 dark:ring-brand-300 dark:ring-offset-[#15171f]',
                selectedDate === day.date && 'outline outline-2 outline-offset-1 outline-brand-500'
              )}
            >
              <span>{Number(day.date.slice(-2))}</span>
              {day.status === 'success' || day.status === 'completed' ? (
                <Flame className="mt-0.5 h-2.5 w-2.5 opacity-90" />
              ) : day.hasActivity ? (
                <span className={cn('mt-1 h-1 w-1 rounded-full', style.dot)} />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StreaksSkeleton() {
  return (
    <div className="page-container">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className="h-28 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-5 h-7 w-16" />
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <Card className="h-[360px] p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-6 h-64 w-full" />
        </Card>
        <Card className="h-[360px] p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-6 h-64 w-full" />
        </Card>
      </div>
    </div>
  );
}

export default function StreaksPage() {
  usePageTitle('Streaks');
  const [overview, setOverview] = useState(null);
  const [month, setMonth] = useState(() => todayKey().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  const [detailHabitId, setDetailHabitId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailMonth, setDetailMonth] = useState(() => todayKey().slice(0, 7));
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const loadOverview = useCallback(async (monthValue, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setCalendarLoading(true);
    setError('');
    try {
      const data = await streakService.overview({ month: monthValue });
      setOverview(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not calculate your streaks.'));
    } finally {
      setLoading(false);
      setCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview(month, { silent: Boolean(overview) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const loadDetail = useCallback(async (habitId, monthValue) => {
    if (!habitId) return;
    setDetailLoading(true);
    setDetailError('');
    try {
      const data = await streakService.habit(habitId, { month: monthValue });
      setDetail(data);
    } catch (requestError) {
      setDetailError(getErrorMessage(requestError, 'We could not load this habit history.'));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!detailHabitId) return;
    loadDetail(detailHabitId, detailMonth);
  }, [detailHabitId, detailMonth, loadDetail]);

  const openHabitDetail = (habit) => {
    // Streak summaries expose `habitId`; fall back to `_id` for safety.
    setDetailHabitId(habit.habitId || habit._id);
    setDetail(null);
    setDetailMonth(month);
    setDetailError('');
  };

  const closeDetail = () => {
    setDetailHabitId(null);
    setDetail(null);
    setDetailError('');
  };

  if (loading && !overview) return <StreaksSkeleton />;

  if (error && !overview) {
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={() => loadOverview(month)} />
      </div>
    );
  }

  const overall = overview?.overall || {};
  const habits = overview?.habits || [];
  const totals = overview?.totals || {};
  const today = overview?.date || todayKey();
  const calendarDays = overview?.calendar?.days || [];
  const detailDays = detail?.calendar?.days || [];

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Consistency, made visible"
        title="Streaks"
        description="Your streak history is calculated from real habit logs and daily productivity — never from placeholder data."
        actions={
          <Button
            as={Link}
            to="/analytics"
            variant="outline"
            leftIcon={<TrendingUp className="h-4 w-4" />}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            View analytics
          </Button>
        }
      />

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Flame}
          label="Current streak"
          value={`${overall.currentStreak ?? 0} ${overall.currentStreak === 1 ? 'day' : 'days'}`}
          note={`Target ${overall.target ?? 60}/100 per active day`}
          accent="bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500"
        />
        <StatTile
          icon={Medal}
          label="Best streak"
          value={`${overall.longestStreak ?? 0} ${overall.longestStreak === 1 ? 'day' : 'days'}`}
          note="Your longest run of target days"
          accent="bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
        />
        <StatTile
          icon={CheckCircle2}
          label="Successful days"
          value={overall.totalSuccessfulDays ?? 0}
          note={`${overall.consistencyRate ?? 0}% of tracked days`}
          accent="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500"
        />
        <StatTile
          icon={Target}
          label="Habit completions"
          value={totals.totalHabitCompletions ?? 0}
          note={`${totals.activeHabits ?? 0} active habits`}
          accent="bg-ink-100 text-ink-700 dark:bg-white/[0.06] dark:text-ink-200"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-warning-100/60 blur-3xl dark:bg-warning-500/10"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-500 to-warning-600 text-white shadow-[0_16px_30px_-16px_rgba(243,167,18,0.9)]">
                <Flame className="h-8 w-8" />
              </span>
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-warning-600 dark:text-warning-500">
                  Overall consistency
                </p>
                <p className="mt-1 font-display text-3xl font-extrabold tracking-[-0.05em] text-ink-900 dark:text-white">
                  {overall.currentStreak ?? 0} days
                </p>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  {overall.lastCompletedDate
                    ? `Last target day ${formatDate(overall.lastCompletedDate, {
                        month: 'short',
                        day: 'numeric',
                      })}`
                    : 'Meet your daily target to begin your streak.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:text-right">
              <div>
                <p className="font-display text-xl font-bold text-ink-900 dark:text-white">
                  {overall.weeklyConsistency ?? 0}%
                </p>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  This week
                </p>
              </div>
              <div>
                <p className="font-display text-xl font-bold text-ink-900 dark:text-white">
                  {overall.monthlyConsistency ?? 0}%
                </p>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  Last 30 days
                </p>
              </div>
            </div>
          </div>
          <div className="relative border-t border-ink-100 px-5 py-4 dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                Rest days are neutral — they never break an overall streak.
              </span>
              <Link
                to="/settings"
                className="focus-ring rounded-lg font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Change target
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4 dark:border-white/[0.06] sm:px-5">
            <div>
              <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                Streak calendar
              </h2>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                {formatMonthYear(`${month}-01`)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMonth((current) => addMonthKey(current, -1))}
                className="focus-ring rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMonth(today.slice(0, 7))}
                className="focus-ring rounded-lg px-2 py-1 text-[0.65rem] font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setMonth((current) => addMonthKey(current, 1))}
                className="focus-ring rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className={cn('px-4 py-4 transition-opacity dark:bg-transparent sm:px-5', calendarLoading && 'opacity-50')}>
            <MonthGrid days={calendarDays} today={today} onSelect={setSelectedDay} />
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.62rem] text-ink-400 dark:text-ink-500">
              {['success', 'missed', 'rest', 'upcoming'].map((status) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  <span className={cn('h-2.5 w-2.5 rounded-sm', statusStyle(status).dot)} />
                  {statusStyle(status).label}
                </span>
              ))}
            </div>
            {selectedDay ? (
              <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/60 px-3.5 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">
                    {formatFullDate(selectedDay.date)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="focus-ring rounded-md px-1.5 py-0.5 text-[0.62rem] font-semibold text-ink-400 hover:text-ink-700 dark:hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                  {selectedDay.status === 'rest'
                    ? 'No scheduled activity — a neutral rest day.'
                    : `Score ${selectedDay.score ?? 0}/100 · ${selectedDay.tasksCompleted ?? 0} tasks · ${
                        selectedDay.habitsCompleted ?? 0
                      } habits`}
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.05rem] font-bold text-ink-900 dark:text-white">
            Habit streaks
          </h2>
          <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
            Each habit is measured on its own scheduled days. Non-scheduled weekdays never break a streak.
          </p>
        </div>
        <Button
          as={Link}
          to="/habits"
          variant="ghost"
          size="sm"
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
        >
          Manage habits
        </Button>
      </div>

      {habits.length ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {habits.map((habit) => (
            <button
              key={habit.habitId}
              type="button"
              onClick={() => openHabitDetail(habit)}
              className="focus-ring surface-card group p-4 text-left transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <HabitCategoryIcon category={habit.category} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                      {habit.name}
                    </p>
                    <p className="mt-0.5 truncate text-[0.65rem] text-ink-400 dark:text-ink-500">
                      {habit.frequency === 'daily' ? 'Every day' : formatWeekdays(habit.daysOfWeek)}
                    </p>
                  </div>
                </div>
                <StreakBadge count={habit.currentStreak} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-ink-50/80 py-2 dark:bg-white/[0.03]">
                  <p className="font-display text-sm font-bold text-ink-900 dark:text-white">
                    {habit.longestStreak}
                  </p>
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                    Best
                  </p>
                </div>
                <div className="rounded-lg bg-ink-50/80 py-2 dark:bg-white/[0.03]">
                  <p className="font-display text-sm font-bold text-ink-900 dark:text-white">
                    {habit.completionRate}%
                  </p>
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                    Rate
                  </p>
                </div>
                <div className="rounded-lg bg-ink-50/80 py-2 dark:bg-white/[0.03]">
                  <p className="font-display text-sm font-bold text-ink-900 dark:text-white">
                    {habit.totalCompletedDays}
                  </p>
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                    Done
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex items-center justify-between text-[0.65rem] text-ink-400 dark:text-ink-500">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-semibold',
                    habit.scheduledToday
                      ? habit.completedToday
                        ? 'text-success-600 dark:text-success-500'
                        : 'text-warning-600 dark:text-warning-500'
                      : 'text-ink-400 dark:text-ink-500'
                  )}
                >
                  {habit.scheduledToday ? (
                    habit.completedToday ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Completed today
                      </>
                    ) : (
                      <>
                        <Target className="h-3 w-3" /> Due today
                      </>
                    )
                  ) : (
                    <>
                      <CalendarDays className="h-3 w-3" /> Not scheduled today
                    </>
                  )}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-brand-600 transition group-hover:gap-2 dark:text-brand-400">
                  History <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Card className="mt-3">
          <EmptyState
            icon={Repeat2}
            title="No habit streaks yet"
            description="Create a habit and check it off on its scheduled days. Your streak will start building from that first log."
            action={
              <Button as={Link} to="/habits" size="sm" leftIcon={<Repeat2 className="h-3.5 w-3.5" />}>
                Go to habits
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={Boolean(detailHabitId)}
        onClose={closeDetail}
        title={detail?.habit?.name || 'Habit history'}
        description={
          detail?.habit
            ? `${
                detail.habit.frequency === 'daily'
                  ? 'Every day'
                  : formatWeekdays(detail.habit.daysOfWeek)
              } · tracked in ${overview?.timezone || 'your timezone'}`
            : 'Loading habit history…'
        }
        size="lg"
      >
        {detailLoading && !detail ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : detailError ? (
          <ErrorState message={detailError} onRetry={() => loadDetail(detailHabitId, detailMonth)} />
        ) : detail ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Current', value: detail.streak.currentStreak, icon: Flame },
                { label: 'Best', value: detail.streak.longestStreak, icon: Medal },
                { label: 'Completion', value: `${detail.streak.completionRate}%`, icon: TrendingUp },
                { label: 'Missed days', value: detail.streak.missedDays, icon: XCircle },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-xl bg-ink-50/80 px-3 py-3 dark:bg-white/[0.03]">
                    <Icon className="h-3.5 w-3.5 text-ink-400" />
                    <p className="mt-1.5 font-display text-lg font-bold text-ink-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-900 dark:text-white">
                  <History className="h-4 w-4 text-brand-500" />
                  {formatMonthYear(`${detailMonth}-01`)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDetailMonth((current) => addMonthKey(current, -1))}
                    className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-white/[0.06]"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailMonth(today.slice(0, 7))}
                    className="focus-ring rounded-lg px-2 py-1 text-[0.65rem] font-semibold text-brand-600 dark:text-brand-400"
                  >
                    This month
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailMonth((current) => addMonthKey(current, 1))}
                    className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-white/[0.06]"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <MonthGrid days={detailDays} today={detail.date} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-ink-700 dark:text-ink-200">
                Last 90 days
              </p>
              <div className="flex flex-wrap gap-1">
                {detail.history.map((day) => (
                  <span
                    key={day.date}
                    title={`${formatFullDate(day.date)} · ${day.status}`}
                    className={cn(
                      'h-4 w-4 rounded-[3px]',
                      statusStyle(day.status).cell
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-[0.62rem] text-ink-400 dark:text-ink-500">
                Completed logs: {detail.completions.length}. Streak bonuses are awarded once per habit at 7 and 30 days.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
