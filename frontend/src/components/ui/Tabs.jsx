import { cn } from '../../utils/cn';

export default function Tabs({ tabs, value, onChange, className, ariaLabel = 'View options' }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-wrap items-center gap-0.5 rounded-xl bg-ink-100/80 p-1 dark:bg-white/[0.04]',
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              'focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              selected
                ? 'bg-white text-ink-900 shadow-sm dark:bg-white/[0.09] dark:text-white'
                : 'text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white'
            )}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
