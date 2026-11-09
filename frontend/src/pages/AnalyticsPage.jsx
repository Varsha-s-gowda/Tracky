import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  Minus,
  Repeat2,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Modal from '../components/ui/Modal';
import Tabs from '../components/ui/Tabs';
import ProgressRing from '../components/ui/ProgressRing';
import { Skeleton } from '../components/ui/Loaders';
import Heatmap from '../components/analytics/Heatmap';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { analyticsService } from '../services/analyticsService';
import { productivityService } from '../services/productivityService';
import {
  formatDate,
  formatFullDate,
  formatMonthShort,
  formatMonthYear,
  todayKey,
} from '../utils/date';
import { getErrorMessage } from '../utils/errors';
import { cn } from '../utils/cn';

const BRAND = '#6746df';
const SUCCESS = '#17b978';
const WARNING = '#f3a712';
const GRID = 'rgba(119, 119, 143, 0.16)';

function ChartTooltip({ active, payload, label, labelFormatter, valueSuffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-200/80 bg-white px-3 py-2.5 text-xs shadow-card dark:border-white/10 dark:bg-[#191b23]">
      <p className="font-semibold text-ink-900 dark:text-white">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      <div className="mt-1.5 space-y-1">
        {payload.map((item) => (
          <p key={item.dataKey} className="flex items-center gap-2 text-ink-500 dark:text-ink-300">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color || item.fill }}
            />
            <span className="capitalize">{item.name}</span>
            <span className="ml-auto font-semibold text-ink-900 dark:text-white">
              {item.value}
              {valueSuffix}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, note, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink-400 dark:text-ink-500">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.04em] text-ink-900 dark:text-white">
            {value}
          </p>
          {note ? <p className="mt-1 truncate text-xs text-ink-500 dark:text-ink-400">{note}</p> : null}
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}

function ChartCard({ title, description, action, children, className, height = 260 }) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-4" style={{ width: '100%', height }}>
        {children}
      </div>
    </Card>
  );
}

function TrendIndicator({ direction, value, suffix = '%' }) {
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-bold',
        direction === 'up'
          ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500'
          : direction === 'down'
            ? 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-500'
            : 'bg-ink-100 text-ink-500 dark:bg-white/[0.06] dark:text-ink-400'
      )}
    >
      <Icon className="h-3 w-3" />
      {direction === 'flat' ? 'No change' : `${Math.abs(value)}${suffix}`}
    </span>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="page-container">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className="h-28 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-5 h-7 w-16" />
          </Card>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {[0, 1].map((item) => (
          <Card key={item} className="h-[340px] p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-6 h-60 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  usePageTitle('Analytics');
  const { toast } = useToast();
  const [range, setRange] = useState(30);
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [heatScope, setHeatScope] = useState('year');
  const [heatYear, setHeatYear] = useState(() => Number(todayKey().slice(0, 4)));
  const [heatMonth, setHeatMonth] = useState(() => todayKey().slice(0, 7));
  const [heatmap, setHeatmap] = useState(null);
  const [heatLoading, setHeatLoading] = useState(true);
  const [heatError, setHeatError] = useState('');

  const [selectedDate, setSelectedDate] = useState('');
  const [dayDetail, setDayDetail] = useState(null);
  const [dayLoading, setDayLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dailyData, weeklyData, monthlyData] = await Promise.all([
        analyticsService.daily({ days: range }),
        analyticsService.weekly({ weeks: 8 }),
        analyticsService.monthly({ months: 6 }),
      ]);
      setDaily(dailyData);
      setWeekly(weeklyData);
      setMonthly(monthlyData);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not load your analytics.'));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const loadHeatmap = useCallback(async () => {
    setHeatLoading(true);
    setHeatError('');
    try {
      const params = heatScope === 'year' ? { year: heatYear } : { month: heatMonth };
      setHeatmap(await analyticsService.heatmap(params));
    } catch (requestError) {
      setHeatError(getErrorMessage(requestError, 'We could not load the activity heatmap.'));
    } finally {
      setHeatLoading(false);
    }
  }, [heatScope, heatYear, heatMonth]);

  useEffect(() => {
    loadHeatmap();
  }, [loadHeatmap]);

  const openDayDetail = useCallback(
    async (day) => {
      if (!day || day.isFuture) return;
      setSelectedDate(day.date);
      setDayDetail(null);
      setDayLoading(true);
      try {
        setDayDetail(await productivityService.score({ date: day.date }));
      } catch (requestError) {
        toast.error(getErrorMessage(requestError, 'We could not load that day.'));
        setSelectedDate('');
      } finally {
        setDayLoading(false);
      }
    },
    [toast]
  );

  const summary = daily?.summary || {};
  const totals = summary.totals || {};
  const comparison = summary.comparison || { metrics: [] };
  const days = daily?.days || [];
  const currentYear = Number(todayKey().slice(0, 4));
  const currentMonth = todayKey().slice(0, 7);

  const dailyChartData = useMemo(
    () =>
      days.map((day) => ({
        date: day.dateKey,
        label: formatDate(day.dateKey, { month: 'short', day: 'numeric' }),
        score: day.score,
        target: day.target,
        tasks: day.tasksCompleted,
        pending: day.tasksPending,
        habits: day.habitsCompleted,
      })),
    [days]
  );

  const weeklyChartData = useMemo(
    () =>
      (weekly?.weeks || []).map((week) => ({
        label: formatDate(week.weekStart, { month: 'short', day: 'numeric' }),
        tasks: week.tasksCompleted,
        habits: week.habitsCompleted,
        score: week.averageScore,
      })),
    [weekly]
  );

  const monthlyChartData = useMemo(
    () =>
      (monthly?.months || []).map((month) => ({
        label: `${formatMonthShort(month.month)} ${month.month.slice(2, 4)}`,
        tasks: month.tasksCompleted,
        habits: month.habitsCompleted,
        score: month.averageScore,
      })),
    [monthly]
  );

  const taskCompletionRate = totals.tasksTotal
    ? Math.round((totals.tasksCompleted / totals.tasksTotal) * 100)
    : 0;

  const bestDay = summary.bestDay;
  const mostConsistent = summary.mostConsistentHabit;
  const noActivity = !totals.activeDays;

  if (loading && !daily) return <AnalyticsSkeleton />;

  if (error && !daily) {
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={loadAnalytics} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="See what is actually happening"
        title="Analytics"
        description="Every chart below is aggregated from your real tasks, habits, logs, and daily productivity records."
        actions={
          <Tabs
            value={range}
            onChange={setRange}
            ariaLabel="Analytics range"
            tabs={[
              { value: 7, label: '7 days' },
              { value: 30, label: '30 days' },
              { value: 90, label: '90 days' },
            ]}
          />
        }
      />

      {noActivity ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-800 dark:border-brand-400/15 dark:bg-brand-400/[0.06] dark:text-brand-200">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <p>
            No activity has been recorded in this range yet. Add a task or check off a habit and these
            charts will fill in from real data.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={TrendingUp}
          label="Average score"
          value={`${summary.averageScore ?? 0}/100`}
          note={`${totals.successfulDays ?? 0} of ${totals.activeDays ?? 0} active days met target`}
          accent="bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
        />
        <StatTile
          icon={CheckCircle2}
          label="Tasks completed"
          value={totals.tasksCompleted ?? 0}
          note={`${taskCompletionRate}% completion · ${totals.tasksPending ?? 0} pending`}
          accent="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500"
        />
        <StatTile
          icon={Repeat2}
          label="Habits completed"
          value={totals.habitsCompleted ?? 0}
          note={`${totals.habitsScheduled ?? 0} scheduled check-ins`}
          accent="bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500"
        />
        <StatTile
          icon={Flame}
          label="Best day"
          value={bestDay ? `${bestDay.score}` : '—'}
          note={bestDay ? formatFullDate(bestDay.date) : 'Complete something to set a best day'}
          accent="bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
        <ChartCard
          title="Daily productivity"
          description={`Scores out of 100 against your target of ${daily?.target ?? 60}.`}
          height={272}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyChartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#77778f' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={22}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#77778f' }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip
                content={<ChartTooltip labelFormatter={(label) => label} valueSuffix="/100" />}
              />
              <ReferenceLine y={daily?.target ?? 60} stroke={SUCCESS} strokeDasharray="5 5" strokeOpacity={0.6} />
              <Area
                type="monotone"
                dataKey="score"
                name="Score"
                stroke={BRAND}
                strokeWidth={2.2}
                fill="url(#scoreFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                Week over week
              </h2>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                Current week vs previous week
              </p>
            </div>
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                comparison.improvements?.length
                  ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500'
                  : 'bg-ink-100 text-ink-500 dark:bg-white/[0.06] dark:text-ink-400'
              )}
            >
              <BarChart3 className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {(comparison.metrics || []).map((metric) => (
              <div key={metric.key} className="rounded-xl bg-ink-50/70 px-3 py-2.5 dark:bg-white/[0.025]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.7rem] font-semibold text-ink-600 dark:text-ink-300">
                    {metric.label}
                  </span>
                  <TrendIndicator direction={metric.direction} value={metric.percentChange} />
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-base font-bold text-ink-900 dark:text-white">
                    {metric.current}
                  </span>
                  <span className="text-[0.62rem] text-ink-400 dark:text-ink-500">
                    was {metric.previous} {metric.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5">
            {(comparison.improvements || []).slice(0, 2).map((metric) => (
              <p
                key={metric.key}
                className="flex items-center gap-1.5 text-[0.68rem] font-medium text-success-700 dark:text-success-500"
              >
                <ArrowUpRight className="h-3 w-3" /> {metric.label} improved
              </p>
            ))}
            {(comparison.declines || []).slice(0, 2).map((metric) => (
              <p
                key={metric.key}
                className="flex items-center gap-1.5 text-[0.68rem] font-medium text-danger-600 dark:text-danger-500"
              >
                <ArrowDownRight className="h-3 w-3" /> {metric.label} declined
              </p>
            ))}
            {!comparison.improvements?.length && !comparison.declines?.length ? (
              <p className="text-[0.68rem] text-ink-400 dark:text-ink-500">
                Both weeks look steady so far.
              </p>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Tasks and habits by day"
          description="Completed actions across the selected range."
          height={250}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#77778f' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={22}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#77778f' }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 11, color: '#77778f', paddingTop: 6 }}
              />
              <Bar dataKey="tasks" name="Tasks" fill={BRAND} radius={[3, 3, 0, 0]} maxBarSize={14} />
              <Bar dataKey="habits" name="Habits" fill={SUCCESS} radius={[3, 3, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Weekly consistency"
          description="Completed volume and average score by week."
          height={250}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyChartData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#77778f' }}
                tickLine={false}
                axisLine={false}
                minTickGap={12}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#77778f' }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 11, color: '#77778f', paddingTop: 6 }}
              />
              <Bar dataKey="tasks" name="Tasks" fill={BRAND} radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="habits" name="Habits" fill={SUCCESS} radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Line
                type="monotone"
                dataKey="score"
                name="Avg score"
                stroke={WARNING}
                strokeWidth={2}
                dot={{ r: 2.5, fill: WARNING, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)]">
        <div className="min-w-0 space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
              Highlights
            </h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
                  <Flame className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400 dark:text-ink-500">
                    Best day
                  </p>
                  {bestDay ? (
                    <>
                      <p className="mt-0.5 text-sm font-bold text-ink-900 dark:text-white">
                        {formatFullDate(bestDay.date)} · {bestDay.score}/100
                      </p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        {bestDay.tasksCompleted} tasks and {bestDay.habitsCompleted} habits completed.
                      </p>
                    </>
                  ) : (
                    <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                      No active days yet. Your best day will appear here.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500">
                  <Repeat2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400 dark:text-ink-500">
                    Most consistent habit
                  </p>
                  {mostConsistent ? (
                    <>
                      <p className="mt-0.5 truncate text-sm font-bold text-ink-900 dark:text-white">
                        {mostConsistent.name}
                      </p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        {mostConsistent.completionRate}% completion · {mostConsistent.currentStreak}-day streak
                      </p>
                    </>
                  ) : (
                    <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                      Create a habit to see your consistency leader.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                  <Target className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400 dark:text-ink-500">
                    Current week
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-ink-900 dark:text-white">
                    {summary.currentWeek?.tasksCompleted ?? 0} tasks · {summary.currentWeek?.habitsCompleted ?? 0} habits
                  </p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {summary.currentWeek?.successfulDays ?? 0} successful days ·{' '}
                    {summary.currentWeek?.averageScore ?? 0}/100 average
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
              Monthly completion
            </h2>
            <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
              Last {monthly?.months?.length || 0} months
            </p>
            <div className="mt-3" style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: '#77778f' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#77778f' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Bar dataKey="tasks" name="Tasks" fill={BRAND} radius={[3, 3, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="habits" name="Habits" fill={SUCCESS} radius={[3, 3, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {monthly?.bestMonth ? (
              <p className="mt-2 text-[0.68rem] text-ink-500 dark:text-ink-400">
                Best month so far: {formatMonthYear(`${monthly.bestMonth.month}-01`)} at{' '}
                {monthly.bestMonth.averageScore}/100.
              </p>
            ) : null}
          </Card>
        </div>

        <Card className="min-w-0 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                Activity heatmap
              </h2>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                One cell per day. Click a day for its score breakdown.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tabs
                value={heatScope}
                onChange={setHeatScope}
                ariaLabel="Heatmap scope"
                tabs={[
                  { value: 'year', label: 'Year' },
                  { value: 'month', label: 'Month' },
                ]}
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (heatScope === 'year') setHeatYear((year) => year - 1);
                    else {
                      const [year, month] = heatMonth.split('-').map(Number);
                      const date = new Date(year, month - 2, 1);
                      setHeatMonth(
                        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                      );
                    }
                  }}
                  className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-white/[0.06]"
                  aria-label={heatScope === 'year' ? 'Previous year' : 'Previous month'}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[92px] text-center text-xs font-semibold text-ink-700 dark:text-ink-200">
                  {heatScope === 'year'
                    ? heatYear
                    : formatMonthYear(`${heatMonth}-01`)}
                </span>
                <button
                  type="button"
                  disabled={
                    heatScope === 'year' ? heatYear >= currentYear : heatMonth >= currentMonth
                  }
                  onClick={() => {
                    if (heatScope === 'year') setHeatYear((year) => year + 1);
                    else {
                      const [year, month] = heatMonth.split('-').map(Number);
                      const date = new Date(year, month, 1);
                      setHeatMonth(
                        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                      );
                    }
                  }}
                  className="focus-ring rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-ink-400 dark:hover:bg-white/[0.06]"
                  aria-label={heatScope === 'year' ? 'Next year' : 'Next month'}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5">
            {heatLoading && !heatmap ? (
              <Skeleton className="h-40 w-full" />
            ) : heatError ? (
              <ErrorState message={heatError} onRetry={loadHeatmap} />
            ) : (
              <Heatmap days={heatmap?.days || []} onSelectDay={openDayDetail} />
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 dark:border-white/[0.06] sm:grid-cols-4">
            {[
              { label: 'Active days', value: heatmap?.summary?.activeDays ?? 0 },
              { label: 'Target met', value: heatmap?.summary?.successfulDays ?? 0 },
              { label: 'Tasks', value: heatmap?.summary?.tasksCompleted ?? 0 },
              { label: 'Habits', value: heatmap?.summary?.habitsCompleted ?? 0 },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-display text-lg font-bold text-ink-900 dark:text-white">
                  {item.value}
                </p>
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          {heatmap?.summary?.averageScore ? (
            <p className="mt-3 text-[0.68rem] text-ink-500 dark:text-ink-400">
              Average score across active days: {heatmap.summary.averageScore}/100 ·{' '}
              {heatmap.summary.xpEarned} XP earned in this period.
            </p>
          ) : null}
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4 dark:border-white/[0.06]">
          <div>
            <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
              Daily breakdown
            </h2>
            <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
              Completed, pending, and habit totals for each day.
            </p>
          </div>
          <Button
            as={Link}
            to="/streaks"
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          >
            View streaks
          </Button>
        </div>

        {days.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="text-[0.6rem] uppercase tracking-[0.1em] text-ink-400 dark:text-ink-500">
                <tr className="border-b border-ink-100 dark:border-white/[0.06]">
                  <th className="px-5 py-2.5 font-bold">Date</th>
                  <th className="px-3 py-2.5 font-bold">Tasks</th>
                  <th className="px-3 py-2.5 font-bold">Pending</th>
                  <th className="px-3 py-2.5 font-bold">Habits</th>
                  <th className="px-3 py-2.5 font-bold">Score</th>
                  <th className="px-5 py-2.5 text-right font-bold">XP</th>
                </tr>
              </thead>
              <tbody>
                {[...days].reverse().slice(0, 14).map((day) => (
                  <tr
                    key={day.dateKey}
                    className="border-b border-ink-50 last:border-b-0 hover:bg-ink-50/60 dark:border-white/[0.04] dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-2.5 font-medium text-ink-800 dark:text-ink-100">
                      {formatDate(day.dateKey, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-3 py-2.5 text-ink-600 dark:text-ink-300">
                      {day.tasksCompleted}/{day.tasksTotal}
                    </td>
                    <td className="px-3 py-2.5 text-ink-600 dark:text-ink-300">{day.tasksPending}</td>
                    <td className="px-3 py-2.5 text-ink-600 dark:text-ink-300">
                      {day.habitsCompleted}/{day.habitsScheduled}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[0.62rem] font-bold',
                          day.successful
                            ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500'
                            : day.hasActivity
                              ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500'
                              : 'bg-ink-100 text-ink-500 dark:bg-white/[0.05] dark:text-ink-400'
                        )}
                      >
                        {day.hasActivity ? `${day.score}/100` : 'Rest'}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold text-brand-600 dark:text-brand-400">
                      +{day.xpEarned || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            compact
            icon={CalendarDays}
            title="No daily records yet"
            description="Complete a task or habit and the daily breakdown will appear here."
          />
        )}
      </Card>

      <Modal
        open={Boolean(selectedDate)}
        onClose={() => {
          setSelectedDate('');
          setDayDetail(null);
        }}
        title={
          selectedDate
            ? formatFullDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })
            : 'Day detail'
        }
        description={dayDetail ? `${dayDetail.timezone} · target ${dayDetail.target}/100` : 'Loading day detail…'}
        size="md"
      >
        {dayLoading && !dayDetail ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : dayDetail?.day ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <ProgressRing
                value={dayDetail.day.score}
                size={132}
                stroke={11}
                label="score"
                indicatorClassName={
                  dayDetail.day.successful
                    ? 'text-success-500'
                    : 'text-warning-500'
                }
              />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="font-display text-lg font-bold text-ink-900 dark:text-white">
                  {dayDetail.day.hasActivity
                    ? dayDetail.day.successful
                      ? 'Target met'
                      : 'Below target'
                    : 'Rest day'}
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
                  {dayDetail.day.hasActivity
                    ? `${dayDetail.day.tasksCompleted} of ${dayDetail.day.tasksTotal} tasks and ${dayDetail.day.habitsCompleted} of ${dayDetail.day.habitsScheduled} scheduled habits complete.`
                    : 'No tasks or habits were scheduled, so this day does not break a streak.'}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[0.62rem] font-semibold text-ink-600 dark:bg-white/[0.06] dark:text-ink-300">
                    {dayDetail.day.completedItems}/{dayDetail.day.scheduledItems} actions
                  </span>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[0.62rem] font-semibold text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                    {dayDetail.day.consistencyRatio}% 7-day consistency
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink-900 dark:text-white">
                <Layers className="h-4 w-4 text-brand-500" />
                Score breakdown
              </h3>
              <div className="mt-3 space-y-3">
                {dayDetail.day.breakdown?.length ? (
                  dayDetail.day.breakdown.map((factor) => (
                    <div key={factor.key}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-ink-600 dark:text-ink-300">
                          {factor.label}
                        </span>
                        <span className="font-semibold text-ink-900 dark:text-white">
                          {factor.points}/{factor.weight}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.06]">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            factor.key === 'habits'
                              ? 'bg-success-500'
                              : factor.key === 'highPriority'
                                ? 'bg-warning-500'
                                : 'bg-brand-500'
                          )}
                          style={{ width: `${Math.min(100, factor.ratio)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    No scoring factors were active on this day.
                  </p>
                )}
              </div>
              <p className="mt-3 text-[0.62rem] leading-4 text-ink-400 dark:text-ink-500">
                Weights: tasks 40, high-priority tasks 20, habits 30, consistency 10. Unavailable
                categories are removed and the remaining weights renormalize to 100.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tasks', value: `${dayDetail.day.tasksCompleted}/${dayDetail.day.tasksTotal}` },
                { label: 'High priority', value: `${dayDetail.day.highPriorityCompleted}/${dayDetail.day.highPriorityTotal}` },
                { label: 'Habits', value: `${dayDetail.day.habitsCompleted}/${dayDetail.day.habitsScheduled}` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-ink-50/80 px-3 py-2.5 dark:bg-white/[0.03]">
                  <p className="font-display text-sm font-bold text-ink-900 dark:text-white">
                    {item.value}
                  </p>
                  <p className="text-[0.56rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
