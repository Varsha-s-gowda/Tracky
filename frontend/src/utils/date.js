const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function pad(value) {
  return String(value).padStart(2, '0');
}

/**
 * Returns a YYYY-MM-DD key using either the browser's local date or a supplied
 * IANA timezone. Date-only values from the API are UTC-midnight strings, so
 * slicing their ISO representation is safe.
 */
export function getDateKey(date = new Date(), timeZone) {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${values.year}-${values.month}-${values.day}`;
    } catch {
      // Fall back to the local date for an invalid timezone.
    }
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(timeZone) {
  return getDateKey(new Date(), timeZone);
}

export function dateKeyFromValue(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
}

export function parseDateKey(key) {
  if (!key) return null;
  const [year, month, day] = key.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  const key = dateKeyFromValue(value);
  const date = parseDateKey(key);
  if (!date || Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function formatFullDate(value, options = {}) {
  return formatDate(value, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatShortWeekday(value) {
  return formatDate(value, { weekday: 'short' });
}

export function formatMonthYear(value) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(value);
  }
  const key = `${String(value).slice(0, 7)}-01`;
  return formatDate(key, { month: 'long', year: 'numeric' });
}

export function formatMonthShort(value) {
  const key = `${String(value).slice(0, 7)}-01`;
  return formatDate(key, { month: 'short' });
}

export function formatTime(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return '';
  const [hour, minute] = value.split(':').map(Number);
  const date = new Date(2000, 0, 1, hour, minute);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function isoDateFromDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function monthKey(value) {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}`;
  }
  return String(value).slice(0, 7);
}

export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function relativeDateLabel(value, timeZone) {
  const key = dateKeyFromValue(value);
  if (!key) return 'No date';
  const today = todayKey(timeZone);
  if (key === today) return 'Today';
  if (key === isoDateFromDate(addDays(parseDateKey(today), 1))) return 'Tomorrow';
  if (key === isoDateFromDate(addDays(parseDateKey(today), -1))) return 'Yesterday';

  const date = parseDateKey(key);
  const now = parseDateKey(today);
  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date);
}

export function isToday(value, timeZone) {
  return dateKeyFromValue(value) === todayKey(timeZone);
}

export function isOverdue(value, dueTime, status) {
  if (!value || status === 'completed') return false;
  const key = dateKeyFromValue(value);
  const today = todayKey();
  if (key < today) return true;
  if (key > today) return false;
  if (!dueTime) return false;
  const now = new Date();
  return dueTime < `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'T';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function getCalendarMatrix(year, monthIndex, weekStartsOn = 1) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const offset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;
  const gridStart = new Date(year, monthIndex, 1 - offset);
  const today = todayKey();

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const key = isoDateFromDate(date);
    return {
      date,
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
      isToday: key === today,
    };
  });
}

export function getWeekdayOptions() {
  return [
    { value: 1, short: 'Mon', label: 'Monday' },
    { value: 2, short: 'Tue', label: 'Tuesday' },
    { value: 3, short: 'Wed', label: 'Wednesday' },
    { value: 4, short: 'Thu', label: 'Thursday' },
    { value: 5, short: 'Fri', label: 'Friday' },
    { value: 6, short: 'Sat', label: 'Saturday' },
    { value: 0, short: 'Sun', label: 'Sunday' },
  ];
}

export function formatWeekdays(days = []) {
  if (!days.length) return 'No days selected';
  if (days.length === 7) return 'Every day';
  const labels = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
  return days
    .slice()
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((day) => labels[day])
    .join(', ');
}

export function getTimezoneOptions(current) {
  let zones = [];
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      zones = Intl.supportedValuesOf('timeZone');
    }
  } catch {
    zones = [];
  }

  if (!zones.length) {
    zones = [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Kolkata',
      'Asia/Dubai',
      'Asia/Singapore',
      'Asia/Tokyo',
      'Australia/Sydney',
    ];
  }

  if (current && !zones.includes(current)) zones = [current, ...zones];
  return zones;
}

export function timezoneLabel(zone) {
  return zone.replace(/_/g, ' ');
}
