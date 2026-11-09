const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

function isValidDateKey(value) {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isValidMonthKey(value) {
  if (typeof value !== 'string' || !MONTH_KEY_PATTERN.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

function dateKeyToUTCDate(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function dateKeyFromDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

/**
 * Returns a YYYY-MM-DD key for a Date in a specific IANA timezone.
 */
function dateKeyInTimeZone(date, timeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function todayKey(timeZone = 'UTC') {
  return dateKeyInTimeZone(new Date(), timeZone);
}

function addDaysToKey(dateKey, days) {
  const date = dateKeyToUTCDate(dateKey);
  date.setUTCDate(date.getUTCDate() + Number(days));
  return dateKeyFromDate(date);
}

function addMonthsToKey(dateKey, months) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + Number(months), 1));
  const daysInTargetMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(day, daysInTargetMonth));
  return dateKeyFromDate(target);
}

function nextRecurrenceDateKey(dateKey, recurrence) {
  if (recurrence === 'daily') return addDaysToKey(dateKey, 1);
  if (recurrence === 'weekly') return addDaysToKey(dateKey, 7);
  if (recurrence === 'monthly') return addMonthsToKey(dateKey, 1);
  return null;
}

function weekdayFromKey(dateKey) {
  return dateKeyToUTCDate(dateKey).getUTCDay();
}

function dayRange(dateKey) {
  const start = dateKeyToUTCDate(dateKey);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function monthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function eachDateKey(startKey, endKey) {
  const keys = [];
  let cursor = startKey;
  let guard = 0;
  while (cursor <= endKey && guard < 5000) {
    keys.push(cursor);
    cursor = addDaysToKey(cursor, 1);
    guard += 1;
  }
  return keys;
}

function daysBetweenKeys(startKey, endKey) {
  const start = dateKeyToUTCDate(startKey);
  const end = dateKeyToUTCDate(endKey);
  return Math.round((end - start) / 86400000);
}

/**
 * Returns the Monday-based start of the week containing dateKey.
 * weekStartsOn uses JavaScript weekday numbers (0 = Sunday, 1 = Monday).
 */
function startOfWeekKey(dateKeyValue, weekStartsOn = 1) {
  const weekday = weekdayFromKey(dateKeyValue);
  const offset = (weekday - weekStartsOn + 7) % 7;
  return addDaysToKey(dateKeyValue, -offset);
}

function endOfWeekKey(dateKeyValue, weekStartsOn = 1) {
  return addDaysToKey(startOfWeekKey(dateKeyValue, weekStartsOn), 6);
}

function monthKeyFromDateKey(dateKeyValue) {
  return String(dateKeyValue).slice(0, 7);
}

function yearRange(year) {
  const value = Number(year);
  return {
    start: `${value}-01-01`,
    end: `${value}-12-31`,
  };
}

module.exports = {
  DATE_KEY_PATTERN,
  MONTH_KEY_PATTERN,
  isValidDateKey,
  isValidMonthKey,
  dateKeyToUTCDate,
  dateKeyFromDate,
  dateKeyInTimeZone,
  todayKey,
  addDaysToKey,
  addMonthsToKey,
  nextRecurrenceDateKey,
  weekdayFromKey,
  dayRange,
  monthRange,
  eachDateKey,
  daysBetweenKeys,
  startOfWeekKey,
  endOfWeekKey,
  monthKeyFromDateKey,
  yearRange,
};
