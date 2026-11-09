import {
  BookOpen,
  Brain,
  Briefcase,
  Dumbbell,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const CATEGORY_CONFIG = {
  Health: {
    icon: HeartPulse,
    className: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300',
  },
  Fitness: {
    icon: Dumbbell,
    className: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300',
  },
  Learning: {
    icon: BookOpen,
    className: 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300',
  },
  Mindfulness: {
    icon: Brain,
    className: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500',
  },
  Work: {
    icon: Briefcase,
    className: 'bg-ink-100 text-ink-600 dark:bg-white/[0.06] dark:text-ink-300',
  },
  Personal: {
    icon: Sparkles,
    className: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500',
  },
};

export default function HabitCategoryIcon({ category = 'Personal', size = 'md', className }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Personal;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        config.className,
        className
      )}
      aria-hidden="true"
    >
      <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />
    </span>
  );
}
