import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  ListTodo,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressRing from '../components/ui/ProgressRing';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Loaders';
import StatCard from '../components/dashboard/StatCard';
import HabitQuickRow from '../components/dashboard/HabitQuickRow';
import UpcomingTaskRow from '../components/dashboard/UpcomingTaskRow';
import TaskItem from '../components/tasks/TaskItem';
import TaskModal from '../components/tasks/TaskModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useRewardToast } from '../hooks/useRewardToast';
import { dashboardService } from '../services/dashboardService';
import { taskService } from '../services/taskService';
import { habitService } from '../services/habitService';
import { streakService } from '../services/streakService';
import { formatFullDate, getGreeting, todayKey, relativeDateLabel } from '../utils/date';
import { dailyMotivation } from '../utils/constants';
import { getErrorMessage } from '../utils/errors';
import { cn } from '../utils/cn';

function ProgressRow({ label, completed, total, tone }) {
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink-500 dark:text-ink-400">{label}</span>
        <span className="font-semibold text-ink-700 dark:text-ink-200">
          {completed}/{total}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.07]">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700', tone)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="page-container">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-11 w-32" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className="h-[148px] p-5">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="mt-5 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
        <div className="space-y-5">
          {[0, 1].map((item) => (
            <Card key={item} className="p-5">
              <Skeleton className="h-5 w-36" />
              <div className="mt-5 space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-5">
          <Card className="h-[330px] p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mx-auto mt-8 h-40 w-40 rounded-full" />
          </Card>
          <Card className="h-[260px] p-5">
            <Skeleton className="h-5 w-32" />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const { toast } = useToast();
  const { showRewards } = useRewardToast();
  const [data, setData] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskBusyId, setTaskBusyId] = useState(null);
  const [habitBusyId, setHabitBusyId] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [dashboard, streakOverview] = await Promise.all([
        dashboardService.getToday(),
        streakService.overview().catch(() => null),
      ]);
      setData(dashboard);
      if (streakOverview) setStreakData(streakOverview);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not load your dashboard.'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const openNewTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleTaskToggle = async (task) => {
    setTaskBusyId(task._id);
    try {
      const completed = task.status !== 'completed';
      const result = await taskService.setCompleted(task._id, completed);
      if (completed && result.nextTask) {
        toast.success('Task completed.', {
          description: `The next occurrence is scheduled for ${relativeDateLabel(
            result.nextTask.dueDate
          )}.`,
        });
      } else {
        toast.success(completed ? 'Task completed.' : 'Task marked as pending.');
      }
      if (completed) showRewards(result.rewards);
      await loadDashboard({ silent: true });
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'We could not update that task.'));
    } finally {
      setTaskBusyId(null);
    }
  };

  const handleHabitToggle = async (habit) => {
    setHabitBusyId(habit._id);
    try {
      const completed = !habit.completedToday;
      const result = await habitService.log(habit._id, {
        completed,
        date: data?.date || todayKey(user?.timezone),
      });
      toast.success(completed ? 'Habit completed for today.' : 'Habit completion undone.');
      if (completed) showRewards(result.rewards);
      await loadDashboard({ silent: true });
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'We could not update that habit.'));
    } finally {
      setHabitBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await taskService.remove(deleteTarget._id);
      toast.success('Task deleted.');
      setDeleteTarget(null);
      await loadDashboard({ silent: true });
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'We could not delete that task.'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !data) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={() => loadDashboard()} />
      </div>
    );
  }

  const stats = data?.stats || {};
  const firstName = user?.name?.split(' ')[0] || 'there';
  const dateLabel = formatFullDate(data?.date || todayKey(user?.timezone), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="page-container">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-ink-400 dark:text-ink-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/70 bg-white px-2.5 py-1 dark:border-white/[0.07] dark:bg-white/[0.025]">
              <CalendarDays className="h-3 w-3" />
              {dateLabel}
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-ink-300 dark:bg-ink-600 sm:block" />
            <span className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
              <Sparkles className="h-3 w-3" />
              {dailyMotivation(data?.date)}
            </span>
          </div>
          <h1 className="font-display text-[1.8rem] font-extrabold tracking-[-0.045em] text-ink-950 dark:text-white sm:text-[2.15rem]">
            {getGreeting()}, {firstName}.
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-500 dark:text-ink-400">
            Here is the shape of your day. A little focus goes a long way.
          </p>
        </div>
        <Button onClick={openNewTask} leftIcon={<Plus className="h-4 w-4" />} className="shrink-0">
          Add task
        </Button>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ListTodo}
          label="Tasks today"
          value={stats.totalTasks ?? 0}
          note={stats.totalTasks ? 'All scheduled for today' : 'A clear day ahead'}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completedTasks ?? 0}
          note={`${stats.completedTasks ?? 0} of ${stats.totalTasks ?? 0} tasks done`}
          accent="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500"
        />
        <StatCard
          icon={Clock3}
          label="Pending"
          value={stats.pendingTasks ?? 0}
          note={stats.pendingTasks ? 'Still in your plan' : 'Nothing waiting on you'}
          accent="bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Daily completion"
          value={`${stats.taskCompletionRate ?? 0}%`}
          note="Tasks completed today"
          progress={stats.taskCompletionRate ?? 0}
          accent="bg-ink-100 text-ink-700 dark:bg-white/[0.06] dark:text-ink-200"
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4 dark:border-white/[0.06] sm:px-5">
              <div>
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Today's tasks
                </h2>
                <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                  {data?.todayTasks?.length
                    ? `${data.todayTasks.filter((task) => task.status !== 'completed').length} still open`
                    : 'Your day is clear'}
                </p>
              </div>
              <Link
                to="/tasks"
                className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {data?.todayTasks?.length ? (
              <div>
                {data.todayTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onToggle={handleTaskToggle}
                    onEdit={openEditTask}
                    onDelete={setDeleteTarget}
                    busy={taskBusyId === task._id}
                    compact
                    showDescription={false}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={ListTodo}
                title="No tasks scheduled for today"
                description="Add the one thing that would make today feel worthwhile."
                action={
                  <Button size="sm" onClick={openNewTask} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                    Add your first task
                  </Button>
                }
              />
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4 dark:border-white/[0.06] sm:px-5">
              <div>
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Today's habits
                </h2>
                <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                  {stats.completedHabits ?? 0} of {stats.totalHabits ?? 0} complete
                </p>
              </div>
              <Link
                to="/habits"
                className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {data?.todayHabits?.length ? (
              <div>
                {data.todayHabits.map((habit) => (
                  <HabitQuickRow
                    key={habit._id}
                    habit={habit}
                    onToggle={handleHabitToggle}
                    busy={habitBusyId === habit._id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={Sparkles}
                title="No habits scheduled today"
                description="Create a daily or weekly habit to start building consistency."
                action={
                  <Button
                    as={Link}
                    to="/habits"
                    size="sm"
                    variant="outline"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    Go to habits
                  </Button>
                }
              />
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4 dark:border-white/[0.06] sm:px-5">
              <div>
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Momentum
                </h2>
                <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                  Streaks, level, and today's score
                </p>
              </div>
              <Link
                to="/streaks"
                className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
              >
                Streaks
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-4 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3 rounded-xl bg-warning-50/70 px-3 py-3 dark:bg-warning-500/[0.07]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-500 text-white">
                  <Flame className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-warning-700 dark:text-warning-500">
                    Overall streak
                  </p>
                  <p className="font-display text-lg font-extrabold tracking-[-0.03em] text-ink-900 dark:text-white">
                    {streakData?.overall?.currentStreak ?? 0} days
                    <span className="ml-2 text-[0.62rem] font-semibold text-ink-400 dark:text-ink-500">
                      best {streakData?.overall?.longestStreak ?? 0}
                    </span>
                  </p>
                </div>
                <Link
                  to="/streaks"
                  className="focus-ring shrink-0 rounded-lg p-1.5 text-warning-600 hover:bg-warning-100 dark:text-warning-500 dark:hover:bg-warning-500/10"
                  aria-label="View streak details"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold text-ink-500 dark:text-ink-400">
                    <Award className="h-3 w-3 text-brand-500" />
                    {data?.xp?.level?.name || 'Beginner'}
                  </span>
                  <span className="text-[0.62rem] font-semibold text-ink-400 dark:text-ink-500">
                    {(data?.xp?.totalXp ?? 0).toLocaleString()} XP
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-[width] duration-700"
                    style={{ width: `${data?.xp?.level?.isMaxLevel ? 100 : data?.xp?.level?.progress ?? 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold text-ink-500 dark:text-ink-400">
                    <Target className="h-3 w-3 text-success-500" />
                    Today's score
                  </span>
                  <span className="text-[0.62rem] font-semibold text-ink-400 dark:text-ink-500">
                    target {data?.productivity?.target ?? 60}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.07]">
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width] duration-700',
                        (data?.productivity?.score ?? 0) >= (data?.productivity?.target ?? 60)
                          ? 'bg-success-500'
                          : 'bg-warning-500'
                      )}
                      style={{ width: `${data?.productivity?.score ?? 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-ink-900 dark:text-white">
                    {data?.productivity?.score ?? 0}
                  </span>
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-[0.6rem] text-ink-400 dark:text-ink-500">
                  <Zap className="h-2.5 w-2.5 text-brand-500" />
                  +{data?.xp?.todayXp ?? 0} XP earned today
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Daily progress
                </h2>
                <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                  Tasks and habits together
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>

            <div className="my-6 flex justify-center">
              <ProgressRing
                value={data?.progress?.overallCompletionRate ?? 0}
                size={164}
                stroke={13}
                label="overall"
              />
            </div>

            <p className="mb-4 text-center text-xs leading-5 text-ink-500 dark:text-ink-400">
              {data?.progress?.totalItems
                ? `${data.progress.completedItems} of ${data.progress.totalItems} actions complete today.`
                : 'A blank canvas. Add a task or habit to begin.'}
            </p>

            <div className="space-y-3.5">
              <ProgressRow
                label="Tasks"
                completed={stats.completedTasks ?? 0}
                total={stats.totalTasks ?? 0}
                tone="bg-brand-500"
              />
              <ProgressRow
                label="Habits"
                completed={stats.completedHabits ?? 0}
                total={stats.totalHabits ?? 0}
                tone="bg-success-500"
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4 dark:border-white/[0.06] sm:px-5">
              <div>
                <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                  Upcoming
                </h2>
                <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">The next seven days</p>
              </div>
              <Link
                to="/calendar"
                className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
              >
                Calendar
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {data?.upcomingTasks?.length ? (
              <div>
                {data.upcomingTasks.map((task) => (
                  <UpcomingTaskRow key={task._id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={CalendarDays}
                title="Nothing due soon"
                description="Your next seven days are open."
              />
            )}
          </Card>
        </div>
      </div>

      <TaskModal
        open={taskModalOpen}
        task={editingTask}
        defaultDate={data?.date || todayKey(user?.timezone)}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSaved={() => loadDashboard({ silent: true })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this task?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” will be removed permanently. This cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
