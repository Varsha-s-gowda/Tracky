import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

export default function ThemeToggle({ className, size = 'md' }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'focus-ring inline-flex items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-500 shadow-sm transition hover:border-ink-300 hover:text-ink-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-300 dark:hover:border-white/20 dark:hover:text-white',
        size === 'sm' ? 'h-9 w-9' : 'h-10 w-10',
        className
      )}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
