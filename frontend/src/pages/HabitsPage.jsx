import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Plus, Repeat2, Sparkles } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Loaders';
import HabitCard from '../components/habits/HabitCard';
import HabitModal from '../components/habits/HabitModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { useRewardToast } from '../hooks/useRewardToast';
import { habitService } from '../services/habitService';
import { formatFullDate, todayKey } from '../utils/date';
import { getErrorMessage } from '../utils/errors';

function HabitsSkeleton() {
  return (
    <div className="page-container">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-11 w-32" />
      </div>
      <Card className="mt-7 h-28 p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-2 w-full" />
      </Card>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card key={item} className="h-56 p-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="mt-4 h-4 w-2/3" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-6 h-9 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function HabitsPage() {
  usePageTitle('My Habits');
  const { user } = useAuth();
  const { toast } = useToast();
  const { showRewards } = useRewardToast();
  const [habits, setHabits] = useState([]);
  const [date, setDate] = useState(todayKey(user?.timezone));
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busyHabitId, setBusyHabitId] = useState(null);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadHabits = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await habitService.list();
      setHabits(data.habits);
      setDate(data.date);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not load your habits.'));
    } finally {
      if (!silent) setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const openNewHabit = () => {
    setEditingHabit(null);
    setHabitModalOpen(true);
  };

  const openEditHabit = (habit) => {
    setEditingHabit(habit);
    setHabitModalOpen(true);
  };

  const handleToggle = async (habit) => {
    setBusyHabitId(habit._id);
    try {
      const completed = !habit.completedToday;
      const result = await habitService.log(habit._id, { completed, date });
      toast.success(completed ? 'Habit completed for today.' : 'Habit completion undone.');
      if (completed) showRewards(result.rewards);
      await loadHabits({ silent: true });
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'We could not update that habit.'));
    } finally {
      setBusyHabitId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await habitService.remove(deleteTarget._id);
      toast.success('Habit and its history were deleted.');
      setDeleteTarget(null);
      await loadHabits({ silent: true });
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'We could not delete that habit.'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !hasLoaded) return <HabitsSkeleton />;

  const scheduled = habits.filter((habit) => habit.scheduledToday);
  const completed = scheduled.filter((habit) => habit.completedToday);
  const completionRate = scheduled.length
    ? Math.round((completed.length / scheduled.length) * 100)
    : 0;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Show up, gently"
        title="My Habits"
        description="Build consistency through small, repeatable actions. Your completion history is recorded day by day."
        actions={
          <Button onClick={openNewHabit} leftIcon={<Plus className="h-4 w-4" />}>
            New habit
          </Button>
        }
      />

      {error ? (
        <div className="mt-7">
          <ErrorState message={error} onRetry={() => loadHabits()} />
        </div>
      ) : (
        <>
          {habits.length ? (
            <Card className="relative mt-7 overflow-hidden p-5">
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl dark:bg-brand-600/10"
                aria-hidden="true"
              />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
                    <Sparkles className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-ink-900 dark:text-white">
                      Today's rhythm
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-ink-500 dark:text-ink-400">
                      {scheduled.length
                        ? `${completed.length} of ${scheduled.length} scheduled habits complete · ${formatFullDate(
                            date,
                            { weekday: 'long', month: 'long', day: 'numeric' }
                          )}`
                        : 'No habits are scheduled for today. Enjoy the rest.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <p className="font-display text-2xl font-bold tracking-[-0.04em] text-ink-900 dark:text-white">
                      {completionRate}%
                    </p>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
                      today
                    </p>
                  </div>
                  <div className="h-10 w-px bg-ink-100 dark:bg-white/10" />
                  <div>
                    <p className="font-display text-2xl font-bold tracking-[-0.04em] text-ink-900 dark:text-white">
                      {habits.length}
                    </p>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-400">
                      active
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-success-500 transition-[width] duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </Card>
          ) : null}

          <div className="mb-3 mt-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[1.05rem] font-bold text-ink-900 dark:text-white">
                Your habits
              </h2>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                {habits.length
                  ? `${scheduled.length} scheduled today`
                  : 'Every lasting change starts with one small promise.'}
              </p>
            </div>
          </div>

          {habits.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {habits.map((habit) => (
                <HabitCard
                  key={habit._id}
                  habit={habit}
                  onToggle={handleToggle}
                  onEdit={openEditHabit}
                  onDelete={setDeleteTarget}
                  busy={busyHabitId === habit._id}
                />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={Repeat2}
                title="No habits yet"
                description="Start with something small enough to repeat: a ten-minute walk, a page of reading, a glass of water."
                action={
                  <Button size="sm" onClick={openNewHabit} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                    Create your first habit
                  </Button>
                }
              />
            </Card>
          )}

          {!habits.length ? (
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-400 dark:text-ink-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-success-500" />
              Completion history is saved from day one.
            </div>
          ) : null}
        </>
      )}

      <HabitModal
        open={habitModalOpen}
        habit={editingHabit}
        onClose={() => {
          setHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSaved={() => loadHabits({ silent: true })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this habit?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” and its completion history will be removed permanently. This cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
