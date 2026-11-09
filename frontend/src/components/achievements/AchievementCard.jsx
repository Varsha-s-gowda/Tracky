import {
  CalendarCheck2,
  CheckCircle2,
  Crown,
  Flame,
  ListChecks,
  Lock,
  Repeat2,
  Trophy,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const ICONS = {
  task: CheckCircle2,
  habit: Repeat2,
  flame: Flame,
  check: ListChecks,
  calendar: CalendarCheck2,
  crown: Crown,
  trophy: Trophy,
};

const TIER_STYLES = {
  bronze: {
    ring: 'ring-warning-500/25',
    icon: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500',
    accent: 'bg-warning-500',
    label: 'Bronze',
  },
  silver: {
    ring: 'ring-ink-300/60',
    icon: 'bg-ink-100 text-ink-600 dark:bg-white/[0.07] dark:text-ink-200',
    accent: 'bg-ink-400',
    label: 'Silver',
  },
  gold: {
    ring: 'ring-warning-500/30',
    icon: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500',
    accent: 'bg-warning-500',
    label: 'Gold',
  },
  platinum: {
    ring: 'ring-brand-400/30',
    icon: 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300',
    accent: 'bg-brand-500',
    label: 'Platinum',
  },
};

export default function AchievementCard({ achievement, isNew = false }) {
  const Icon = ICONS[achievement.icon] || Trophy;
  const tier = TIER_STYLES[achievement.tier] || TIER_STYLES.bronze;
  const unlocked = achievement.unlocked;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 transition-all duration-300',
        unlocked
          ? 'border-ink-200 bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.025]'
          : 'border-ink-200/70 bg-ink-50/40 dark:border-white/[0.06] dark:bg-white/[0.015]',
        isNew && 'animate-unlock ring-2 ring-brand-400/50'
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
            unlocked ? tier.icon : 'bg-ink-100 text-ink-400 dark:bg-white/[0.04] dark:text-ink-600',
            unlocked ? tier.ring : 'ring-ink-200 dark:ring-white/[0.06]'
          )}
        >
          <Icon className={cn('h-5 w-5', !unlocked && 'opacity-50')} />
          {!unlocked ? (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-ink-200 text-ink-500 dark:border-[#15171f] dark:bg-white/15 dark:text-ink-300">
              <Lock className="h-2 w-2" strokeWidth={3} />
            </span>
          ) : null}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'text-sm font-bold leading-5',
                unlocked ? 'text-ink-900 dark:text-white' : 'text-ink-500 dark:text-ink-400'
              )}
            >
              {achievement.name}
            </h3>
            <span
              className={cn(
                'shrink-0 rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.08em]',
                unlocked
                  ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500'
                  : 'bg-ink-100 text-ink-400 dark:bg-white/[0.05] dark:text-ink-500'
              )}
            >
              {unlocked ? 'Earned' : tier.label}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-ink-500 dark:text-ink-400">
            {achievement.description}
          </p>

          {!unlocked ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[0.62rem] font-semibold text-ink-400 dark:text-ink-500">
                <span>
                  {achievement.progress.current} / {achievement.progress.target}
                </span>
                <span>{achievement.progress.percent}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.06]">
                <div
                  className={cn('h-full rounded-full', tier.accent)}
                  style={{ width: `${achievement.progress.percent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 flex items-center gap-1 text-[0.62rem] font-semibold text-success-600 dark:text-success-500">
              <CheckCircle2 className="h-3 w-3" />
              {achievement.unlockedAt
                ? `Unlocked ${new Date(achievement.unlockedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`
                : 'Unlocked'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
