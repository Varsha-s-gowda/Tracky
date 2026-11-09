export const PRIORITIES = [
  {
    value: 'low',
    label: 'Low',
    badge:
      'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20',
    dot: 'bg-sky-500',
  },
  {
    value: 'medium',
    label: 'Medium',
    badge:
      'bg-warning-50 text-warning-700 ring-warning-500/20 dark:bg-warning-500/10 dark:text-warning-500 dark:ring-warning-500/20',
    dot: 'bg-warning-500',
  },
  {
    value: 'high',
    label: 'High',
    badge:
      'bg-danger-50 text-danger-700 ring-danger-500/15 dark:bg-danger-500/10 dark:text-danger-500 dark:ring-danger-500/20',
    dot: 'bg-danger-500',
  },
];

export const PRIORITY_MAP = Object.fromEntries(PRIORITIES.map((item) => [item.value, item]));

export const RECURRENCES = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
];

export const RECURRENCE_MAP = Object.fromEntries(
  RECURRENCES.map((item) => [item.value, item.label])
);

export const TASK_CATEGORIES = ['Personal', 'Work', 'Study', 'Health', 'Errands', 'General'];

export const HABIT_CATEGORIES = [
  'Personal',
  'Health',
  'Fitness',
  'Learning',
  'Mindfulness',
  'Work',
];

export const TARGET_UNITS = [
  { value: 'times', label: 'times' },
  { value: 'minutes', label: 'minutes' },
  { value: 'hours', label: 'hours' },
  { value: 'pages', label: 'pages' },
  { value: 'glasses', label: 'glasses' },
  { value: 'sessions', label: 'sessions' },
  { value: 'km', label: 'km' },
];

export const MOTIVATION_MESSAGES = [
  'Small steps, repeated daily, become remarkable results.',
  'You do not need a perfect day — just a deliberate one.',
  'Progress is built in quiet, consistent moments.',
  'Focus on the next right thing. Momentum will follow.',
  'Make today a little lighter than yesterday.',
  'Consistency is a form of self-respect.',
  'A calm plan is more powerful than a busy mind.',
  'The best time to build a better day is right now.',
];

export function dailyMotivation(dateKey = '') {
  const seed = [...dateKey].reduce((total, character) => total + character.charCodeAt(0), 0);
  return MOTIVATION_MESSAGES[seed % MOTIVATION_MESSAGES.length];
}

export const TASK_SORT_OPTIONS = [
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'created', label: 'Recently added' },
];
