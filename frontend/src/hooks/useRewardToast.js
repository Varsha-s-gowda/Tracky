import { useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';

const AWARD_LABELS = {
  task_completion: 'Task completed',
  habit_completion: 'Habit completed',
  daily_all_tasks: 'All daily tasks complete',
  habit_streak_7: '7-day habit streak',
  habit_streak_30: '30-day habit streak',
};

/**
 * Centralises the XP and achievement notifications returned by the backend.
 * Reward amounts always come from the API — the client never calculates XP.
 */
export function useRewardToast() {
  const { toast } = useToast();
  const { xpAlertsEnabled, achievementAlertsEnabled } = useSettings();

  const showRewards = useCallback(
    (rewards) => {
      if (!rewards) return;

      if (xpAlertsEnabled && rewards.xpEarned > 0) {
        const awards = Array.isArray(rewards.xpAwards) ? rewards.xpAwards : [];
        const description = awards.length
          ? awards.map((award) => `+${award.amount} XP · ${award.description || AWARD_LABELS[award.type]}`).join(' · ')
          : 'Progress saved to your account.';
        toast.success(`+${rewards.xpEarned} XP earned`, { description });
      }

      if (achievementAlertsEnabled && Array.isArray(rewards.newlyUnlocked)) {
        rewards.newlyUnlocked.forEach((achievement) => {
          toast.success('Achievement unlocked', {
            description: achievement?.name
              ? `${achievement.name} — ${achievement.description}`
              : 'You reached a new milestone.',
            duration: 5600,
          });
        });
      }
    },
    [toast, xpAlertsEnabled, achievementAlertsEnabled]
  );

  return { showRewards };
}
