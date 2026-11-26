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

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Pads a positive integer to 2 digits with leading zero.
 */
function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

/**
 * Converts a local `Date` instance to `YYYY-MM-DD` without UTC drift.
 */
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's local calendar date in `YYYY-MM-DD` format.
 */
export function getTodayISO(): string {
  return toLocalISODate(new Date());
}

/**
 * Returns a local `YYYY-MM-DD` date offset by `daysOffset` from today.
 */
export function getOffsetDateISO(daysOffset: number): string {
  const target = new Date();
  target.setDate(target.getDate() + daysOffset);
  return toLocalISODate(target);
}

/**
 * Parses a `YYYY-MM-DD` string into a local `Date` object, or returns `null` if invalid.
 */
export function parseISODate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

/**
 * Checks whether a string is a valid calendar date in `YYYY-MM-DD` format.
 */
export function isValidISODate(isoDate: string): boolean {
  return parseISODate(isoDate) !== null;
}

/**
 * Formats `YYYY-MM-DD` as e.g. `"Thu, 26 Nov 2026"`.
 */
export function formatDisplayDate(isoDate: string): string {
  const parsed = parseISODate(isoDate);
  if (!parsed) {
    return isoDate;
  }

  const weekday = WEEKDAYS_SHORT[parsed.getDay()];
  const day = parsed.getDate();
  const month = MONTHS_SHORT[parsed.getMonth()];
  const year = parsed.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

export function formatLongDate(isoDate: string): string {
  const parsed = parseISODate(isoDate);
  if (!parsed) {
    return isoDate;
  }

  return `${parsed.getDate()} ${MONTHS_LONG[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

/**
 * Formats `YYYY-MM-DD` as `"Today"`, `"Yesterday"`, or `"24 Nov 2026"`.
 */
export function formatFriendlyDate(isoDate: string): string {
  if (isoDate === getTodayISO()) {
    return 'Today';
  }
  if (isoDate === getOffsetDateISO(-1)) {
    return 'Yesterday';
  }
  const parsed = parseISODate(isoDate);
  if (!parsed) {
    return isoDate;
  }
  return `${parsed.getDate()} ${MONTHS_SHORT[parsed.getMonth()]} ${parsed.getFullYear()}`;
}
