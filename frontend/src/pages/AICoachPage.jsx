import { Bot } from 'lucide-react';
import ComingSoonPage from '../components/ui/ComingSoonPage';
import { usePageTitle } from '../hooks/usePageTitle';

export default function AICoachPage() {
  usePageTitle('AI Coach');
  return (
    <ComingSoonPage
      icon={Bot}
      part="Part 3"
      title="A coach that knows your rhythm."
      description="Tracky AI will turn your own activity into thoughtful guidance — helping you plan realistically, notice patterns, and adjust without judgment."
      features={[
        'Personalized daily planning suggestions',
        'Habit and workload insights from your history',
        'Gentle course-correction when plans slip',
        'A focused conversation space for your next step',
      ]}
      accent="bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
    />
  );
}
