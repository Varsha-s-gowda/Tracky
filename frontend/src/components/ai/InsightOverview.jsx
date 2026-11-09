import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Lightbulb,
  ListTodo,
  Repeat2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { formatFullDate, relativeDateLabel, todayKey } from '../../utils/date';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const CATEGORY_STYLES = {
  focus: 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300',
  habits: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500',
  productivity: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500',
  planning: 'bg-ink-100 text-ink-600 dark:bg-white/[0.06] dark:text-ink-300',
  general: 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300',
};

function StatTile({ icon: Icon, label, value, note, accent }) {
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
      <p className="mt-2.5 font-display text-xl font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
        {value}
      </p>
      {note ? <p className="mt-0.5 text-[0.65rem] text-ink-400 dark:text-ink-500">{note}</p> : null}
    </div>
  );
}

function ListCard({ icon: Icon, title, description, items, emptyText, accent }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-2.5">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', accent)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">{description}</p>
          ) : null}
        </div>
      </div>
      {items?.length ? (
        <ul className="mt-4 space-y-2.5">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-start gap-2 text-xs leading-5 text-ink-600 dark:text-ink-300">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs leading-5 text-ink-400 dark:text-ink-500">{emptyText}</p>
      )}
    </Card>
  );
}

export default function InsightOverview({ insights, configured, onAction }) {
  const { user } = useAuth();
  const timezone = user?.timezone;
  const stats = insights?.stats || {};

  if (!insights?.hasData) {
    return (
      <Card className="mt-5">
        <EmptyState
          icon={Bot}
          title="Your coach needs a little history"
          description="Tracky AI analyses your real tasks, habits, streaks, and scores. Add a task or check in a habit and your first insights will appear here."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/tasks" className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 text-[0.8125rem] font-semibold text-white transition hover:bg-brand-700">
                <ListTodo className="h-3.5 w-3.5" /> Add a task
              </Link>
              <Link to="/habits" className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 text-[0.8125rem] font-semibold text-ink-800 transition hover:bg-ink-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-ink-100">
                <Repeat2 className="h-3.5 w-3.5" /> Create a habit
              </Link>
            </div>
          }
        />
      </Card>
    );
  }

  const trendIcon = insights.scoreTrend === 'up' ? TrendingUp : insights.scoreTrend === 'down' ? TrendingDown : Target;
  const TrendIcon = trendIcon;

  return (
    <div className="mt-5 space-y-5">
      <Card className="overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-[1rem] font-bold text-ink-900 dark:text-white">
                  This week in context
                </h2>
                <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                  Calculated from your recorded tasks, habits, and productivity scores.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={insights.scoreTrend === 'up' ? 'success' : insights.scoreTrend === 'down' ? 'warning' : 'neutral'} dot>
                <TrendIcon className="h-3 w-3" />
                {insights.scoreTrend === 'flat'
                  ? 'Holding steady'
                  : `${insights.scoreDelta > 0 ? '+' : ''}${insights.scoreDelta} vs last week`}
              </Badge>
              {!configured ? <Badge variant="outline">Rules-only insight</Badge> : null}
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-600 dark:text-ink-300">
            {insights.summary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 py-5 sm:px-6 lg:grid-cols-4">
          <StatTile
            icon={CheckCircle2}
            label="Tasks done"
            value={stats.tasksCompleted ?? 0}
            note={`${stats.tasksPending ?? 0} still pending`}
            accent="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500"
          />
          <StatTile
            icon={Repeat2}
            label="Habit check-ins"
            value={stats.habitsCompleted ?? 0}
            note={`of ${stats.habitsScheduled ?? 0} scheduled`}
            accent="bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
          />
          <StatTile
            icon={TrendingUp}
            label="Average score"
            value={`${stats.averageScore ?? 0}/100`}
            note={`${stats.successfulDays ?? 0} successful days`}
            accent="bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500"
          />
          <StatTile
            icon={Flame}
            label="Overall streak"
            value={`${stats.overallStreak ?? 0} days`}
            note={`${stats.totalXp?.toLocaleString?.() ?? 0} XP · ${stats.level || 'Beginner'}`}
            accent="bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500"
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ListCard
          icon={CheckCircle2}
          title="What is working"
          description="Strengths visible in your recent records."
          items={insights.strengths}
          emptyText="No strengths have been recorded yet. Complete a task or habit to start."
          accent="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500"
        />
        <ListCard
          icon={AlertTriangle}
          title="Where to pay attention"
          description="Patterns that are costing you momentum."
          items={insights.weaknesses}
          emptyText="No clear weak spots in the current window — keep going."
          accent="bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500"
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning-500" />
            <div>
              <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                Recommended next moves
              </h2>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                Specific suggestions drawn from your pending work and patterns.
              </p>
            </div>
          </div>
          <Button onClick={() => onAction?.('chat')} disabled={!configured} leftIcon={<Sparkles className="h-3.5 w-3.5" />} size="sm">
            Ask the coach
          </Button>
        </div>

        {insights.recommendations.length ? (
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            {insights.recommendations.map((recommendation) => (
              <Link
                key={recommendation.id || recommendation.title}
                to={recommendation.link || '/coach'}
                className="focus-ring group flex flex-col rounded-xl border border-ink-200/70 p-4 transition hover:border-brand-300 hover:bg-brand-50/30 dark:border-white/10 dark:hover:border-brand-400/40 dark:hover:bg-brand-400/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', CATEGORY_STYLES[recommendation.category] || CATEGORY_STYLES.general)}>
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <Badge variant={recommendation.priority === 'high' ? 'danger' : recommendation.priority === 'medium' ? 'warning' : 'neutral'}>
                    {recommendation.priority || 'medium'}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-semibold text-ink-900 dark:text-white">
                  {recommendation.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
                  {recommendation.detail}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-brand-600 dark:text-brand-400">
                  Open workspace
                  <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            icon={Lightbulb}
            title="No recommendations right now"
            description="Your current data does not reveal any urgent adjustments."
          />
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Weekday patterns</h3>
          </div>
          <div className="mt-4 space-y-2.5">
            {insights.bestWeekday ? (
              <div className="flex items-center justify-between rounded-xl bg-success-50/70 px-3 py-2.5 dark:bg-success-500/[0.07]">
                <span className="text-xs font-medium text-ink-600 dark:text-ink-300">
                  Most productive
                </span>
                <span className="text-xs font-bold text-success-700 dark:text-success-500">
                  {insights.bestWeekday.name} · {insights.bestWeekday.averageScore}/100
                </span>
              </div>
            ) : null}
            {insights.leastProductiveWeekday ? (
              <div className="flex items-center justify-between rounded-xl bg-warning-50/70 px-3 py-2.5 dark:bg-warning-500/[0.07]">
                <span className="text-xs font-medium text-ink-600 dark:text-ink-300">
                  Least productive
                </span>
                <span className="text-xs font-bold text-warning-700 dark:text-warning-500">
                  {insights.leastProductiveWeekday.name} · {insights.leastProductiveWeekday.averageScore}/100
                </span>
              </div>
            ) : null}
            {insights.bestDay ? (
              <p className="flex items-start gap-2 text-[0.68rem] leading-5 text-ink-500 dark:text-ink-400">
                <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning-500" />
                Best recent day: {formatFullDate(insights.bestDay.dateKey)} with a score of{' '}
                {insights.bestDay.score}/100.
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-warning-500" />
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Upcoming milestones</h3>
          </div>
          {insights.upcomingMilestones?.length ? (
            <ul className="mt-4 space-y-2.5">
              {insights.upcomingMilestones.map((milestone) => (
                <li key={`${milestone.type}-${milestone.habitId || 'overall'}-${milestone.milestone}`} className="flex items-start justify-between gap-2 rounded-xl bg-ink-50/70 px-3 py-2.5 dark:bg-white/[0.03]">
                  <span className="min-w-0 text-xs text-ink-600 dark:text-ink-300">
                    <span className="block truncate font-semibold text-ink-800 dark:text-ink-100">
                      {milestone.name}
                    </span>
                    {milestone.currentStreak} of {milestone.milestone} days
                  </span>
                  <Badge variant={milestone.daysTo <= 2 ? 'success' : 'neutral'}>
                    {milestone.daysTo === 0 ? 'Today' : `${milestone.daysTo}d`}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs leading-5 text-ink-400 dark:text-ink-500">
              No streak milestone is within two weeks. Keep checking in to build one.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-danger-500" />
            <h3 className="text-sm font-semibold text-ink-900 dark:text-white">Pending priorities</h3>
          </div>
          {insights.pendingHighPriority?.length ? (
            <ul className="mt-4 space-y-2.5">
              {insights.pendingHighPriority.slice(0, 4).map((task) => (
                <li key={task.id || task._id} className="rounded-xl bg-ink-50/70 px-3 py-2.5 dark:bg-white/[0.03]">
                  <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">{task.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[0.62rem] text-ink-400 dark:text-ink-500">
                    <Clock3 className="h-3 w-3" />
                    {task.dueDate
                      ? task.dueDate < todayKey(timezone)
                        ? `Overdue · ${relativeDateLabel(task.dueDate, timezone)}`
                        : relativeDateLabel(task.dueDate, timezone)
                      : 'No due date'}
                  </p>
                </li>
              ))}
              <li>
                <Link to="/tasks" className="focus-ring inline-flex items-center gap-1 rounded-lg text-[0.68rem] font-semibold text-brand-600 dark:text-brand-400">
                  Manage tasks <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          ) : (
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink-400 dark:text-ink-500">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" />
              No high-priority task is currently pending. That is a real win.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
