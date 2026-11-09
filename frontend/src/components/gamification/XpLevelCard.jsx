import { Award, Sparkles, TrendingUp, Zap } from 'lucide-react';
import Card from '../ui/Card';
import { cn } from '../../utils/cn';

export default function XpLevelCard({ xp, className, compact = false }) {
  if (!xp?.level) {
    return (
      <Card className={cn('p-5', className)}>
        <p className="text-sm text-ink-500 dark:text-ink-400">XP is loading…</p>
      </Card>
    );
  }

  const { level } = xp;
  const progress = level.isMaxLevel ? 100 : level.progress;

  return (
    <Card className={cn('relative overflow-hidden p-5', className)}>
      <div
        className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-brand-100/70 blur-3xl dark:bg-brand-600/10"
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
            Level {level.index + 1}
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.035em] text-ink-900 dark:text-white">
            {level.name}
          </h2>
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            {level.isMaxLevel
              ? 'The highest level. Keep setting the pace.'
              : `${level.xpToNextLevel.toLocaleString()} XP to ${level.nextLevel.name}`}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-[0_12px_26px_-14px_rgba(103,70,223,0.9)] dark:bg-brand-500">
          <Award className="h-5 w-5" />
        </span>
      </div>

      <div className="relative mt-5">
        <div className="flex items-end justify-between gap-3">
          <span className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink-900 dark:text-white">
            {xp.totalXp.toLocaleString()}
            <span className="ml-1 text-xs font-semibold text-ink-400 dark:text-ink-500">XP</span>
          </span>
          <span className="text-[0.68rem] font-semibold text-ink-500 dark:text-ink-400">
            {level.isMaxLevel
              ? 'Max level'
              : `${level.xpIntoLevel.toLocaleString()} / ${level.xpForNextLevel.toLocaleString()}`}
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.07]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={level.isMaxLevel ? 'Maximum level reached' : `Progress to ${level.nextLevel.name}`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {!compact ? (
        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-ink-50/80 px-3 py-2.5 dark:bg-white/[0.035]">
            <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-400 dark:text-ink-500">
              <Zap className="h-3 w-3" />
              Today
            </p>
            <p className="mt-1 text-sm font-bold text-ink-900 dark:text-white">
              +{xp.todayXp.toLocaleString()} XP
            </p>
          </div>
          <div className="rounded-xl bg-ink-50/80 px-3 py-2.5 dark:bg-white/[0.035]">
            <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-400 dark:text-ink-500">
              <TrendingUp className="h-3 w-3" />
              Last 7 days
            </p>
            <p className="mt-1 text-sm font-bold text-ink-900 dark:text-white">
              +{xp.weekXp.toLocaleString()} XP
            </p>
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 text-[0.68rem] leading-4 text-brand-700 dark:border-brand-400/15 dark:bg-brand-400/[0.06] dark:text-brand-300">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          XP is awarded by the Tracky backend. Completing tasks, habits, and streaks all count.
        </div>
      ) : null}
    </Card>
  );
}
