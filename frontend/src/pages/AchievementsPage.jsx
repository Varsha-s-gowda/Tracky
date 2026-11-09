import { Trophy } from 'lucide-react';
import ComingSoonPage from '../components/ui/ComingSoonPage';
import { usePageTitle } from '../hooks/usePageTitle';

export default function AchievementsPage() {
  usePageTitle('Achievements');
  return (
    <ComingSoonPage
      icon={Trophy}
      part="Part 2"
      title="Progress worth noticing."
      description="Meaningful milestones that recognize the consistency behind your progress — not empty points or noisy gamification."
      features={[
        'Streak milestones for daily habits',
        'Task and focus achievements earned from real activity',
        'Personal bests and monthly consistency badges',
        'A lasting record of the days you showed up',
      ]}
      accent="bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500"
    />
  );
}
