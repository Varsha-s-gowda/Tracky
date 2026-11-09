const ApiError = require('./ApiError');
const { isValidDateKey, isValidMonthKey } = require('./date');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function requiredString(value, field, { min = 1, max = 500 } = {}) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `${field} is required.`);
  }
  const cleaned = value.trim();
  if (cleaned.length < min) {
    throw new ApiError(400, `${field} must be at least ${min} characters.`);
  }
  if (cleaned.length > max) {
    throw new ApiError(400, `${field} must be at most ${max} characters.`);
  }
  return cleaned;
}

function optionalString(value, field, { max = 2000 } = {}) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    throw new ApiError(400, `${field} must be a string.`);
  }
  const cleaned = value.trim();
  if (cleaned.length > max) {
    throw new ApiError(400, `${field} must be at most ${max} characters.`);
  }
  return cleaned;
}

function validEmail(value) {
  const email = requiredString(value, 'Email', { max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, 'Please enter a valid email address.');
  }
  return email;
}

function validPassword(value) {
  if (typeof value !== 'string') {
    throw new ApiError(400, 'Password is required.');
  }
  if (value.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }
  if (value.length > 72) {
    throw new ApiError(400, 'Password must be at most 72 characters.');
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new ApiError(400, 'Password must include at least one letter and one number.');
  }
  return value;
}

function oneOf(value, allowed, field, fallback) {
  if ((value === undefined || value === null || value === '') && fallback !== undefined) {
    return fallback;
  }
  if (!allowed.includes(value)) {
    throw new ApiError(400, `${field} must be one of: ${allowed.join(', ')}.`);
  }
  return value;
}

function dateKey(value, field, { required = true, fallback } = {}) {
  if ((value === undefined || value === null || value === '') && !required && fallback !== undefined) {
    return fallback;
  }
  if (!isValidDateKey(value)) {
    throw new ApiError(400, `${field} must be a valid date in YYYY-MM-DD format.`);
  }
  return value;
}

function monthKey(value, field, { fallback } = {}) {
  if ((value === undefined || value === null || value === '') && fallback) return fallback;
  if (!isValidMonthKey(value)) {
    throw new ApiError(400, `${field} must be a valid month in YYYY-MM format.`);
  }
  return value;
}

function timeString(value, field = 'Due time') {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
    throw new ApiError(400, `${field} must be a valid time in HH:mm format.`);
  }
  return value;
}

function validTimezone(value, { fallback = 'UTC' } = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' || value.length > 100) {
    throw new ApiError(400, 'Please provide a valid timezone.');
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return value;
  } catch {
    throw new ApiError(400, 'Please provide a valid timezone.');
  }
}

function booleanValue(value, field, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'boolean') {
    throw new ApiError(400, `${field} must be true or false.`);
  }
  return value;
}

function numberInRange(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof number !== 'number' || Number.isNaN(number) || !Number.isFinite(number)) {
    throw new ApiError(400, `${field} must be a valid number.`);
  }
  if (number < min || number > max) {
    throw new ApiError(400, `${field} must be between ${min} and ${max}.`);
  }
  return number;
}

function weekdays(value, field = 'Weekdays') {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(400, `${field} must include at least one day.`);
  }
  const cleaned = [...new Set(value)].map((day) => {
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new ApiError(400, `${field} must contain numbers from 0 (Sunday) to 6 (Saturday).`);
    }
    return day;
  });
  return cleaned.sort((a, b) => a - b);
}

function stringArray(value, field, { maxItems = 10, maxLength = 30 } = {}) {
  if (value === undefined || value === null || value === '') return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  if (list.length > maxItems) {
    throw new ApiError(400, `${field} can contain at most ${maxItems} items.`);
  }
  return [
    ...new Set(
      list
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ].map((item) => {
    if (item.length > maxLength) {
      throw new ApiError(400, `${field} items must be at most ${maxLength} characters.`);
    }
    return item;
  });
}

module.exports = {
  requiredString,
  optionalString,
  validEmail,
  validPassword,
  oneOf,
  dateKey,
  monthKey,
  timeString,
  validTimezone,
  booleanValue,
  numberInRange,
  weekdays,
  stringArray,
};
