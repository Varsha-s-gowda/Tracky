import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  FileText,
  Plus,
  RefreshCw,
  Repeat2,
  Sparkles,
  Target,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import ConfirmDialog from '../ui/ConfirmDialog';
import ProgressRing from '../ui/ProgressRing';
import { Skeleton } from '../ui/Loaders';
import FormAlert from '../../components/auth/FormAlert';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { aiService } from '../../services/aiService';
import {
  addDays,
  formatDate,
  isoDateFromDate,
  parseDateKey,
  todayKey,
} from '../../utils/date';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

const BRAND = '#6746df';
const MUTED = '#b9b9cc';
const SUCCESS = '#17b978';
const GRID = 'rgba(119, 119, 143, 0.16)';
const CHART_LABELS = {
  tasks: 'Tasks',
  habits: 'Habits',
  score: 'Avg score',
  successfulDays: 'Good days',
};

function startOfWeekKey(key) {
  const date = parseDateKey(key);
  if (!date) return key;
  const offset = (date.getDay() + 6) % 7;
  return isoDateFromDate(addDays(date, -offset));
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-200/80 bg-white px-3 py-2.5 text-xs shadow-card dark:border-white/10 dark:bg-[#191b23]">
      <p className="font-semibold text-ink-900 dark:text-white">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload.map((item) => (
          <p key={item.dataKey} className="flex items-center gap-2 text-ink-500 dark:text-ink-300">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
            <span>{item.name}</span>
            <span className="ml-auto font-semibold text-ink-900 dark:text-white">{item.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function MetricTile({ icon: Icon, label, value, note, accent }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="flex items-center gap-2">
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', accent)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-400 dark:text-ink-500">
          {label}
        </p>
      </div>
      <p className="mt-2.5 font-display text-lg font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
        {value}
      </p>
      {note ? <p className="mt-0.5 text-[0.65rem] text-ink-400 dark:text-ink-500">{note}</p> : null}
    </div>
  );
}

function AIStatusNote({ report }) {
  if (report.aiStatus === 'generated') {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-brand-50/70 px-3.5 py-3 text-xs leading-5 text-brand-900/80 dark:bg-brand-400/[0.07] dark:text-brand-100/75">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          AI narrative generated{report.model ? ` with ${report.model}` : ''}. Every number below still
          comes directly from your records.
        </span>
      </div>
    );
  }
  if (report.aiStatus === 'failed') {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-warning-50/80 px-3.5 py-3 text-xs leading-5 text-warning-900/80 dark:bg-warning-500/[0.08] dark:text-warning-200/80">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          The AI narrative could not be generated. This report is still complete because it was built
          from your real task, habit, streak, and score data.
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-xl bg-ink-50/80 px-3.5 py-3 text-xs leading-5 text-ink-600 dark:bg-white/[0.03] dark:text-ink-300">
      <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        No AI narrative is attached. The server is running in rules-only mode, so this report contains
        verified data and deterministic recommendations only.
      </span>
    </div>
  );
}

function ReportDetail({ report, onDelete }) {
  const metrics = report.metrics || {};
  const isWeekly = report.type === 'weekly';
  const comparison = Array.isArray(metrics.comparison) ? metrics.comparison : [];

  const comparisonChart = useMemo(
    () =>
      comparison.map((item) => ({
        label: CHART_LABELS[item.key] || item.label,
        current: item.current,
        previous: item.previous,
      })),
    [comparison]
  );

  const dailyChart = useMemo(
    () => [
      {
        label: 'Tasks',
        done: metrics.tasksCompletedCount || 0,
        remaining: metrics.tasksPendingCount || 0,
      },
      {
        label: 'Habits',
        done: metrics.habitsCompletedCount || 0,
        remaining: Math.max(
          0,
          (metrics.habitsScheduledCount || 0) - (metrics.habitsCompletedCount || 0)
        ),
      },
    ],
    [metrics]
  );

  const score = isWeekly ? metrics.averageScore || 0 : metrics.score || 0;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isWeekly ? 'brand' : 'success'} dot>
                {isWeekly ? 'Weekly report' : 'Daily report'}
              </Badge>
              <Badge variant={report.source === 'ai' ? 'brand' : 'neutral'}>
                {report.source === 'ai' ? 'AI narrative' : 'Data-driven'}
              </Badge>
            </div>
            <h2 className="mt-2 font-display text-lg font-bold tracking-[-0.025em] text-ink-900 dark:text-white">
              {report.title}
            </h2>
            <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
              {formatDate(report.rangeStart, { month: 'short', day: 'numeric', year: 'numeric' })}
              {report.rangeEnd !== report.rangeStart
                ? ` – ${formatDate(report.rangeEnd, { month: 'short', day: 'numeric', year: 'numeric' })}`
                : ''}
              {' · '}generated {formatDate(report.generatedAt)}
            </p>
          </div>
          <Button
            variant="danger-ghost"
            size="xs"
            onClick={() => onDelete(report)}
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          >
            Delete
          </Button>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <AIStatusNote report={report} />
          <p className="text-sm leading-6 text-ink-600 dark:text-ink-300">{report.summary}</p>

          <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-100 bg-ink-50/40 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <ProgressRing
                value={score}
                size={116}
                stroke={9}
                label={isWeekly ? 'week avg' : 'day score'}
                indicatorClassName={score >= (metrics.target || 60) ? 'text-success-500' : 'text-warning-500'}
              />
              <p className="mt-2 text-[0.65rem] text-ink-400 dark:text-ink-500">
                Target {metrics.target || 60}/100
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {isWeekly ? (
                <>
                  <MetricTile
                    icon={CheckCircle2}
                    label="Tasks done"
                    value={metrics.tasksCompleted || 0}
                    note={`${metrics.tasksPending || 0} pending`}
                    accent="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500"
                  />
                  <MetricTile
                    icon={Repeat2}
                    label="Habit check-ins"
                    value={metrics.habitsCompleted || 0}
                    note={`of ${metrics.habitsScheduled || 0} scheduled`}
                    accent="bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
                  />
                  <MetricTile
                    icon={Target}
                    label="Successful days"
                    value={metrics.successfulDays || 0}
                    note={`${metrics.activeDays || 0} active days`}
                    accent="bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500"
                  />
                  <MetricTile
                    icon={Trophy}
                    label="Achievements"
                    value={metrics.achievementsUnlocked || 0}
                    note={`${metrics.missedHabits || 0} habits missed`}
                    accent="bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
                  />
                </>
              ) : (
                <>
                  <MetricTile
                    icon={CheckCircle2}
                    label="Tasks completed"
                    value={metrics.tasksCompletedCount || 0}
                    note={`${metrics.tasksPendingCount || 0} pending`}
                    accent="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500"
                  />
                  <MetricTile
                    icon={Repeat2}
                    label="Habits completed"
                    value={metrics.habitsCompletedCount || 0}
                    note={`of ${metrics.habitsScheduledCount || 0} scheduled`}
                    accent="bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
                  />
                  <MetricTile
                    icon={CalendarDays}
                    label="Overall streak"
                    value={`${metrics.overallCurrentStreak || 0}d`}
                    note={`best ${metrics.overallLongestStreak || 0} days`}
                    accent="bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500"
                  />
                  <MetricTile
                    icon={Trophy}
                    label="Achievements"
                    value={metrics.achievementsUnlocked || 0}
                    note="unlocked this day"
                    accent="bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
                  />
                </>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-brand-500" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-400 dark:text-ink-500">
                {isWeekly ? 'This week vs last week' : 'Completion picture'}
              </h3>
            </div>
            {isWeekly && !comparisonChart.length ? (
              <p className="mt-3 text-xs text-ink-400 dark:text-ink-500">
                No previous-week comparison is available for this report.
              </p>
            ) : (
              <div className="mt-3 h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={isWeekly ? comparisonChart : dailyChart}
                    margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#8b8b9c', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#8b8b9c', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(103,70,223,0.05)' }} />
                    {isWeekly ? (
                      <>
                        <Bar dataKey="current" name="This week" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={28} />
                        <Bar dataKey="previous" name="Previous week" fill={MUTED} radius={[4, 4, 0, 0]} maxBarSize={28} />
                      </>
                    ) : (
                      <>
                        <Bar dataKey="done" name="Completed" fill={SUCCESS} radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="remaining" name="Remaining" fill={MUTED} radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {report.sections?.map((section) => (
          <Card key={section.key} className="p-5">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{section.title}</h3>
            {section.body ? (
              <p className="mt-1.5 text-xs leading-5 text-ink-500 dark:text-ink-400">{section.body}</p>
            ) : null}
            {section.items?.length ? (
              <ul className="mt-3 space-y-2">
                {section.items.map((item, index) => (
                  <li key={`${section.key}-${index}`} className="flex items-start gap-2 text-xs leading-5 text-ink-600 dark:text-ink-300">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        ))}
      </div>

      {report.recommendations?.length ? (
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-brand-500" />
            Recommendations
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {report.recommendations.map((recommendation, index) => (
              <div key={`${recommendation.title}-${index}`} className="rounded-xl border border-ink-100 p-3.5 dark:border-white/[0.06]">
                <p className="text-xs font-semibold text-ink-900 dark:text-white">{recommendation.title}</p>
                <p className="mt-1 text-[0.68rem] leading-5 text-ink-500 dark:text-ink-400">{recommendation.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export default function ReportsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = todayKey(user?.timezone);
  const [dailyDate, setDailyDate] = useState(today);
  const [weekStart, setWeekStart] = useState(startOfWeekKey(today));
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [generating, setGenerating] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await aiService.listReports({ limit: 40 });
      setReports(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Reports could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = reports.find((report) => report._id === selectedId) || reports[0] || null;

  const upsert = (report) => {
    setReports((current) =>
      [report, ...current.filter((item) => item._id !== report._id)].sort((a, b) =>
        String(b.periodKey).localeCompare(String(a.periodKey))
      )
    );
    setSelectedId(report._id);
  };

  const describeStatus = (report) => {
    if (report.aiStatus === 'generated') return 'AI narrative added.';
    if (report.aiStatus === 'failed') return 'AI narrative failed; your data-driven report is ready.';
    return 'Generated from your real records. AI narrative is unavailable in rules-only mode.';
  };

  const generateDaily = async () => {
    setActionError('');
    setGenerating('daily');
    try {
      const report = await aiService.generateDaily({ date: dailyDate, useAI: true });
      upsert(report);
      toast.success('Daily report ready.', { description: describeStatus(report) });
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, 'The daily report could not be generated.'));
    } finally {
      setGenerating(null);
    }
  };

  const generateWeekly = async () => {
    setActionError('');
    setGenerating('weekly');
    try {
      const report = await aiService.generateWeekly({ weekStart, useAI: true });
      upsert(report);
      toast.success('Weekly report ready.', { description: describeStatus(report) });
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, 'The weekly report could not be generated.'));
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await aiService.removeReport(deleteTarget._id);
      setReports((current) => current.filter((item) => item._id !== deleteTarget._id));
      if (selectedId === deleteTarget._id) setSelectedId(null);
      setDeleteTarget(null);
      toast.success('Report deleted.');
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'The report could not be deleted.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-5 space-y-5">
      <Card className="overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-500" />
            <div>
              <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                Generate a report
              </h2>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                Reports are calculated from your saved records. AI narration is added only when the
                provider is configured and succeeds.
              </p>
            </div>
          </div>
        </div>
        {actionError ? <div className="px-5 pt-4 sm:px-6"><FormAlert>{actionError}</FormAlert></div> : null}
        <div className="grid gap-4 px-5 py-5 md:grid-cols-2 sm:px-6">
          <div className="rounded-xl border border-ink-100 p-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-brand-500" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-400 dark:text-ink-500">
                Daily summary
              </h3>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="block flex-1">
                <span className="mb-1 block text-[0.7rem] font-semibold text-ink-600 dark:text-ink-300">
                  Report date
                </span>
                <input
                  type="date"
                  value={dailyDate}
                  max={today}
                  onChange={(event) => setDailyDate(event.target.value)}
                  className="focus-ring h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
                />
              </label>
              <Button
                size="sm"
                onClick={generateDaily}
                loading={generating === 'daily'}
                disabled={Boolean(generating)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="shrink-0"
              >
                Generate
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-ink-100 p-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-3.5 w-3.5 text-brand-500" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-400 dark:text-ink-500">
                Weekly summary
              </h3>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="block flex-1">
                <span className="mb-1 block text-[0.7rem] font-semibold text-ink-600 dark:text-ink-300">
                  Week starting
                </span>
                <input
                  type="date"
                  value={weekStart}
                  max={today}
                  onChange={(event) => setWeekStart(event.target.value)}
                  className="focus-ring h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
                />
              </label>
              <Button
                size="sm"
                onClick={generateWeekly}
                loading={generating === 'weekly'}
                disabled={Boolean(generating)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="shrink-0"
              >
                Generate
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </Card>
          <Card className="space-y-3 p-5">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </Card>
        </div>
      ) : error ? (
        <ErrorState title="Reports could not be loaded" message={error} onRetry={load} />
      ) : !reports.length ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Generate your first daily or weekly report above. Tracky AI will only use activity that actually exists in your account."
          />
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="h-fit p-3 xl:sticky xl:top-[88px]">
            <div className="flex items-center justify-between px-2 pb-2 pt-1">
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-ink-400 dark:text-ink-500">
                Report history
              </h3>
              <button
                type="button"
                onClick={load}
                className="focus-ring rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
                aria-label="Refresh reports"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-[620px] space-y-1.5 overflow-y-auto pr-1">
              {reports.map((report) => {
                const active = selected?._id === report._id;
                return (
                  <button
                    key={report._id}
                    type="button"
                    onClick={() => setSelectedId(report._id)}
                    className={cn(
                      'focus-ring w-full rounded-xl border p-3 text-left transition',
                      active
                        ? 'border-brand-300 bg-brand-50/60 dark:border-brand-400/40 dark:bg-brand-400/[0.07]'
                        : 'border-transparent hover:border-ink-200 hover:bg-ink-50/70 dark:hover:border-white/10 dark:hover:bg-white/[0.03]'
                    )}
                    aria-pressed={active}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg',
                          report.type === 'weekly'
                            ? 'bg-brand-100 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300'
                            : 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500'
                        )}
                      >
                        {report.type === 'weekly' ? (
                          <CalendarRange className="h-3 w-3" />
                        ) : (
                          <CalendarDays className="h-3 w-3" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-800 dark:text-ink-100">
                        {report.type === 'weekly' ? 'Weekly' : 'Daily'} ·{' '}
                        {formatDate(report.periodKey, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[0.66rem] leading-4 text-ink-500 dark:text-ink-400">
                      {report.summary}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge variant={report.source === 'ai' ? 'brand' : 'neutral'} className="!px-1.5 !py-0.5 !text-[0.55rem]">
                        {report.source === 'ai' ? 'AI' : 'Data'}
                      </Badge>
                      <span className="text-[0.58rem] text-ink-400 dark:text-ink-500">
                        {formatDate(report.generatedAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="min-w-0">
            {selected ? (
              <ReportDetail report={selected} onDelete={setDeleteTarget} />
            ) : (
              <Card>
                <EmptyState icon={FileText} title="Select a report" description="Pick a report from the history to view its details." />
              </Card>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this report?"
        description="The saved report will be removed from your history. Your tasks, habits, and scores are not affected."
        confirmLabel="Delete report"
      />
    </div>
  );
}
