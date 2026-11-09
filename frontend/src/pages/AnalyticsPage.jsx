import { BarChart3 } from 'lucide-react';
import ComingSoonPage from '../components/ui/ComingSoonPage';
import { usePageTitle } from '../hooks/usePageTitle';

export default function AnalyticsPage() {
  usePageTitle('Analytics');
  return (
    <ComingSoonPage
      icon={BarChart3}
      part="Part 2"
      title="Analytics that tell the truth."
      description="A deeper view of your consistency, focus, and follow-through — built from the real history Tracky is already recording for you."
      features={[
        'Completion trends across tasks and habits',
        'Streaks, best days, and consistency patterns',
        'Productivity heatmaps and category breakdowns',
        'Weekly reflections designed to guide the next week',
      ]}
    />
  );
}
