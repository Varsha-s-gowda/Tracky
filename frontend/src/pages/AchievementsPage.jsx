import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Crown,
  Flame,
  ListChecks,
  Lock,
  Repeat2,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Tabs from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Loaders';
import XpLevelCard from '../components/gamification/XpLevelCard';
import AchievementCard from '../components/achievements/AchievementCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { achievementService } from '../services/achievementService';
import { xpService } from '../services/xpService';
import { formatDate } from '../utils/date';
import { getErrorMessage } from '../utils/errors';
import { cn } from '../utils/cn';

const SEEN_KEY = 'tracky.seenAchievements';

const TX_META = {
  task_completion: { label: 'Task completed', icon: CheckCircle2, tone: 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300' },
  habit_completion: { label: 'Habit completed', icon: Repeat2, tone: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500' },
  daily_all_tasks: { label: 'All daily tasks', icon: ListChecks, tone: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500' },
  habit_streak_7: { label: '7-day bonus', icon: Flame, tone: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500' },
  habit_streak_30: { label: '30-day bonus', icon: Flame, tone: 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500' },
};

function readSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return null;
    return new Set(JSON.parse(raw));
  } catch {
    return null;
  }
}

function AchievementsSkeleton() {
  return (
    <div className="page-container">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <Card className="h-64 p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-6 h-8 w-48" />
          <Skeleton className="mt-4 h-2 w-full" />
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <Card key={item} className="h-28 p-4">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <Skeleton className="mt-3 h-4 w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  usePageTitle('Achievements');
  const [data, setData] = useState(null);
  const [xp, setXp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newKeys, setNewKeys] = useState([]);
  const [filter, setFilter] = useState('all');
  const [historyLimit, setHistoryLimit] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [achievementData, xpData] = await Promise.all([
        achievementService.list(),
        xpService.get({ limit: 100 }),
      ]);
      setData(achievementData);
      setXp(xpData);

      const unlockedKeys = achievementData.achievements
        .filter((achievement) => achievement.unlocked)
        .map((achievement) => achievement.key);
      const seen = readSeen();
      if (seen) {
        setNewKeys(unlockedKeys.filter((key) => !seen.has(key)));
      }
      try {
        const merged = new Set([...(seen || []), ...unlockedKeys]);
        localStorage.setItem(SEEN_KEY, JSON.stringify([...merged]));
      } catch {
        // Local storage can be unavailable in strict privacy modes.
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not load your achievements.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const achievements = data?.achievements || [];
  const stats = data?.stats || {};
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  const visibleAchievements = useMemo(() => {
    if (filter === 'unlocked') return achievements.filter((achievement) => achievement.unlocked);
    if (filter === 'locked') return achievements.filter((achievement) => !achievement.unlocked);
    return achievements;
  }, [achievements, filter]);

  const transactions = xp?.transactions || [];

  if (loading && !data) return <AchievementsSkeleton />;

  if (error && !data) {
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Progress worth noticing"
        title="Achievements"
        description="Milestones are unlocked from real completions and streak history. XP is calculated and stored by the backend only."
        actions={
          <Button
            as={Link}
            to="/streaks"
            variant="outline"
            leftIcon={<Flame className="h-4 w-4" />}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Build a streak
          </Button>
        }
      />

      <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <XpLevelCard xp={xp} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
              <Trophy className="h-4 w-4" />
            </span>
            <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.04em] text-ink-900 dark:text-white">
              {unlockedCount}
              <span className="ml-1 text-sm font-semibold text-ink-400 dark:text-ink-500">
                / {achievements.length}
              </span>
            </p>
            <p className="text-xs text-ink-500 dark:text-ink-400">Achievements unlocked</p>
          </Card>
          <Card className="p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.04em] text-ink-900 dark:text-white">
              {stats.completedTaskCount ?? 0}
            </p>
            <p className="text-xs text-ink-500 dark:text-ink-400">Tasks completed all time</p>
          </Card>
          <Card className="p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500">
              <Repeat2 className="h-4 w-4" />
            </span>
            <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.04em] text-ink-900 dark:text-white">
              {stats.habitCompletedCount ?? 0}
            </p>
            <p className="text-xs text-ink-500 dark:text-ink-400">Habit check-ins logged</p>
          </Card>
          <Card className="p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500">
              <Flame className="h-4 w-4" />
            </span>
            <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.04em] text-ink-900 dark:text-white">
              {stats.maxStreak ?? 0}
            </p>
            <p className="text-xs text-ink-500 dark:text-ink-400">Best streak across habits &amp; days</p>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.05rem] font-bold text-ink-900 dark:text-white">
            Achievement badges
          </h2>
          <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
            Locked badges show live progress toward their requirement.
          </p>
        </div>
        <Tabs
          value={filter}
          onChange={setFilter}
          ariaLabel="Filter achievements"
          tabs={[
            { value: 'all', label: `All ${achievements.length}` },
            { value: 'unlocked', label: `Earned ${unlockedCount}` },
            { value: 'locked', label: `Locked ${achievements.length - unlockedCount}` },
          ]}
        />
      </div>

      {visibleAchievements.length ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.key}
              achievement={achievement}
              isNew={newKeys.includes(achievement.key)}
            />
          ))}
        </div>
      ) : (
        <Card className="mt-4">
          <EmptyState
            compact
            icon={filter === 'unlocked' ? Trophy : Lock}
            title={filter === 'unlocked' ? 'No badges earned yet' : 'Every badge is earned'}
            description={
              filter === 'unlocked'
                ? 'Complete a task or check off a habit to unlock your first achievement.'
                : 'You have collected every available achievement. Exceptional consistency.'
            }
          />
        </Card>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                Level journey
              </h2>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                {xp?.level?.name || 'Beginner'} · {xp?.totalXp ?? 0} XP total
              </p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
              <Crown className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {(xp?.levels || []).map((level) => {
              const current = xp?.level?.index === level.index;
              const reached = (xp?.level?.index ?? 0) >= level.index;
              return (
                <div
                  key={level.key}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition',
                    current
                      ? 'border-brand-300 bg-brand-50/70 dark:border-brand-400/25 dark:bg-brand-400/[0.07]'
                      : 'border-transparent bg-ink-50/60 dark:bg-white/[0.025]'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-bold',
                      reached
                        ? 'bg-brand-600 text-white dark:bg-brand-500'
                        : 'bg-ink-200 text-ink-500 dark:bg-white/10 dark:text-ink-400'
                    )}
                  >
                    {reached ? <Star className="h-3 w-3" /> : level.index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-xs font-semibold',
                        current
                          ? 'text-brand-800 dark:text-brand-200'
                          : 'text-ink-700 dark:text-ink-200'
                      )}
                    >
                      {level.name}
                    </p>
                    <p className="text-[0.6rem] text-ink-400 dark:text-ink-500">
                      {level.minXp.toLocaleString()} XP
                    </p>
                  </div>
                  {current ? (
                    <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.08em] text-white dark:bg-brand-500">
                      You
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-[0.65rem] leading-4 text-brand-700 dark:border-brand-400/15 dark:bg-brand-400/[0.05] dark:text-brand-300">
            <p className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> XP rules
            </p>
            <p className="mt-1">
              Task +10 · Habit +15 · All daily tasks +20 · 7-day habit streak +50 · 30-day habit
              streak +200. Rewards are deduplicated so a repeated action never grants XP twice.
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4 dark:border-white/[0.06]">
            <div>
              <h2 className="font-display text-[0.98rem] font-bold text-ink-900 dark:text-white">
                XP history
              </h2>
              <p className="mt-0.5 text-xs text-ink-400 dark:text-ink-500">
                Every reward is a stored backend transaction.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[0.65rem] font-bold text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
              <Zap className="h-3 w-3" />
              {transactions.length} entries
            </span>
          </div>

          {transactions.length ? (
            <>
              <div className="divide-y divide-ink-100 dark:divide-white/[0.05]">
                {transactions.slice(0, historyLimit).map((transaction) => {
                  const meta = TX_META[transaction.type] || {
                    label: 'XP awarded',
                    icon: Award,
                    tone: 'bg-ink-100 text-ink-600 dark:bg-white/[0.05] dark:text-ink-300',
                  };
                  const Icon = meta.icon;
                  return (
                    <div key={transaction._id} className="flex items-center gap-3 px-5 py-3">
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                          meta.tone
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink-800 dark:text-ink-100">
                          {transaction.description || meta.label}
                        </p>
                        <p className="text-[0.62rem] text-ink-400 dark:text-ink-500">
                          {formatDate(transaction.dateKey, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          · {meta.label}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-brand-600 dark:text-brand-400">
                        +{transaction.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
              {transactions.length > historyLimit ? (
                <div className="border-t border-ink-100 px-5 py-3 text-center dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setHistoryLimit((current) => current + 20)}
                    className="focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
                  >
                    Show more
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              compact
              icon={Zap}
              title="No XP transactions yet"
              description="Complete a task or habit and your first XP entry will appear here."
              action={
                <Button as={Link} to="/tasks" size="sm" variant="outline">
                  Go to tasks
                </Button>
              }
            />
          )}
        </Card>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-[0.65rem] text-ink-400 dark:text-ink-600">
        <Trophy className="h-3.5 w-3.5" />
        Longest streak · {stats.maxStreak ?? 0} days · Level {xp?.level?.name || 'Beginner'}
      </div>
    </div>
  );
}
