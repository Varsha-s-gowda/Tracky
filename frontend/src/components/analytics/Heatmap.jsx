import { useMemo, useState } from 'react';
import { formatDate } from '../../utils/date';
import { cn } from '../../utils/cn';

const LEVEL_CLASSES = [
  'bg-ink-100 dark:bg-white/[0.055]',
  'bg-brand-100 dark:bg-brand-900/70',
  'bg-brand-300 dark:bg-brand-700/80',
  'bg-brand-500 dark:bg-brand-500',
  'bg-brand-700 dark:bg-brand-400',
];

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function chunk(values, size) {
  const rows = [];
  for (let index = 0; index < values.length; index += size) {
    rows.push(values.slice(index, index + size));
  }
  return rows;
}

function monthLabel(dateKey) {
  return formatDate(dateKey, { month: 'short' });
}

export default function Heatmap({ days = [], onSelectDay, className }) {
  const [hovered, setHovered] = useState(null);

  const { weeks, monthLabels } = useMemo(() => {
    if (!days.length) return { weeks: [], monthLabels: [] };

    const offset = new Date(`${days[0].date}T00:00:00.000Z`).getUTCDay();
    const padded = [...Array.from({ length: offset }, () => null), ...days];
    const built = chunk(padded, 7);

    const labels = built.map((week) => {
      const first = week.find(Boolean);
      if (!first) return '';
      const monthKeyValue = first.date.slice(0, 7);
      return `${monthKeyValue}|${monthLabel(first.date)}`;
    });

    // Show a month label only when it changes, matching GitHub's spacing.
    let last = '';
    const resolved = labels.map((label) => {
      if (!label) return '';
      const [key, text] = label.split('|');
      if (key === last) return '';
      last = key;
      return text;
    });

    return { weeks: built, monthLabels: resolved };
  }, [days]);

  if (!days.length) {
    return (
      <div className={cn('py-10 text-center text-sm text-ink-500 dark:text-ink-400', className)}>
        No activity recorded for this period yet.
      </div>
    );
  }

  const hoveredDay = hovered || days[days.length - 1];

  return (
    <div className={className}>
      <div className="mb-3 flex min-h-[22px] flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
          {hoveredDay
            ? `${formatDate(hoveredDay.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${
                hoveredDay.hasActivity ? `${hoveredDay.score}/100` : 'No scheduled activity'
              }`
            : 'Hover a day for details'}
        </p>
        {hoveredDay && hoveredDay.hasActivity ? (
          <p className="text-[0.68rem] text-ink-400 dark:text-ink-500">
            {hoveredDay.tasksCompleted}/{hoveredDay.tasksTotal} tasks ·{' '}
            {hoveredDay.habitsCompleted}/{hoveredDay.habitsScheduled} habits
            {hoveredDay.xpEarned ? ` · +${hoveredDay.xpEarned} XP` : ''}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-full gap-2">
          <div className="grid shrink-0 grid-rows-7 gap-[3px] pt-[18px]">
            {WEEKDAY_LABELS.map((label, index) => (
              <span
                key={index}
                className="flex h-3 items-center text-[0.55rem] font-medium text-ink-400 dark:text-ink-600"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                <span className="h-[15px] whitespace-nowrap text-[0.55rem] font-medium text-ink-400 dark:text-ink-600">
                  {monthLabels[weekIndex] || ''}
                </span>
                {week.map((day, dayIndex) =>
                  day ? (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => onSelectDay?.(day)}
                      onMouseEnter={() => setHovered(day)}
                      onFocus={() => setHovered(day)}
                      onMouseLeave={() => setHovered(null)}
                      onBlur={() => setHovered(null)}
                      aria-label={`${day.date}: ${
                        day.hasActivity ? `productivity score ${day.score}` : 'no scheduled activity'
                      }`}
                      className={cn(
                        'focus-ring h-3 w-3 rounded-[3px] transition-transform duration-150 hover:scale-125',
                        day.isFuture
                          ? 'cursor-default bg-transparent ring-1 ring-inset ring-ink-100 dark:ring-white/[0.04]'
                          : LEVEL_CLASSES[day.level] || LEVEL_CLASSES[0],
                        !day.isFuture && day.successful && 'ring-1 ring-inset ring-success-500/40',
                        day.date === hoveredDay?.date && !day.isFuture && 'ring-2 ring-brand-600 ring-offset-1 dark:ring-brand-300 dark:ring-offset-[#15171f]'
                      )}
                    />
                  ) : (
                    <span key={`empty-${weekIndex}-${dayIndex}`} className="h-3 w-3" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[0.62rem] text-ink-400 dark:text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-success-500/20 ring-1 ring-inset ring-success-500/50" />
          Day met your target
        </span>
        <span className="inline-flex items-center gap-1.5">
          Less
          {LEVEL_CLASSES.map((tone, index) => (
            <span key={index} className={cn('h-3 w-3 rounded-[3px]', tone)} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
