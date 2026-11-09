import { cn } from '../../utils/cn';

export default function ProgressRing({
  value = 0,
  size = 136,
  stroke = 11,
  className,
  trackClassName = 'text-ink-100 dark:text-white/[0.07]',
  indicatorClassName = 'text-brand-600 dark:text-brand-400',
  label,
  sublabel,
  showValue = true,
}) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', indicatorClassName)}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {showValue ? (
          <span className="font-display text-[1.7rem] font-bold leading-none tracking-[-0.04em] text-ink-900 dark:text-white">
            {Math.round(safeValue)}%
          </span>
        ) : null}
        {label ? (
          <span className="mt-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-400 dark:text-ink-500">
            {label}
          </span>
        ) : null}
        {sublabel ? (
          <span className="mt-1 text-xs text-ink-500 dark:text-ink-400">{sublabel}</span>
        ) : null}
      </div>
    </div>
  );
}
