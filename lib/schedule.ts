// Core scheduling logic: projects future hair-wash days from a start date,
// an interval (days), and optional preferred weekdays / dates to avoid.
// All dates are plain "YYYY-MM-DD" strings and treated as UTC midnight so the
// math is immune to the server's local timezone.

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday ... 6 = Saturday

export interface ScheduleConfig {
  /** ISO date (YYYY-MM-DD) of the most recent wash. */
  startDate: string;
  /** Days between washes, e.g. 3 = every third day. */
  intervalDays: number;
  /** Preferred weekdays to land on. Empty/undefined = no preference. */
  weekdays?: Weekday[];
  /** ISO dates to never land on (e.g. a big event). */
  skipDates?: string[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * Finds the nearest date to `date` (searching +0, +1, -1, +2, -2, ...) whose
 * UTC weekday is in `weekdays`. Ties (equal distance) prefer the later date,
 * so a wash never lands earlier than the theoretical interval suggests.
 */
function snapToNearestWeekday(date: Date, weekdays: Weekday[]): Date {
  if (weekdays.length === 0) return date;
  const allowed = new Set(weekdays);
  for (let offset = 0; offset <= 6; offset++) {
    const forward = addDays(date, offset);
    if (allowed.has(forward.getUTCDay() as Weekday)) return forward;
    if (offset > 0) {
      const backward = addDays(date, -offset);
      if (allowed.has(backward.getUTCDay() as Weekday)) return backward;
    }
  }
  return date; // unreachable: every week contains at least one allowed day
}

/** Next date, at or after `date`, whose weekday is in `weekdays`. */
function nextAllowedWeekday(date: Date, weekdays: Weekday[]): Date {
  const allowed = new Set(weekdays);
  let d = date;
  for (let i = 0; i < 7; i++) {
    if (allowed.has(d.getUTCDay() as Weekday)) return d;
    d = addDays(d, 1);
  }
  return date; // unreachable
}

export interface ScheduleValidationError {
  field: string;
  message: string;
}

export function validateConfig(config: ScheduleConfig): ScheduleValidationError[] {
  const errors: ScheduleValidationError[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.startDate)) {
    errors.push({ field: "startDate", message: "Start date must be YYYY-MM-DD." });
  } else if (Number.isNaN(parseISODate(config.startDate).getTime())) {
    errors.push({ field: "startDate", message: "Start date is not a valid date." });
  }
  if (!Number.isInteger(config.intervalDays) || config.intervalDays < 1 || config.intervalDays > 60) {
    errors.push({ field: "intervalDays", message: "Interval must be a whole number between 1 and 60." });
  }
  if (config.weekdays) {
    for (const w of config.weekdays) {
      if (!Number.isInteger(w) || w < 0 || w > 6) {
        errors.push({ field: "weekdays", message: "Weekdays must be integers 0-6." });
        break;
      }
    }
  }
  return errors;
}

/**
 * Projects wash dates forward from config.startDate up to (and including)
 * `horizonDate`. Each occurrence anchors the next interval, so weekday
 * snapping doesn't compound drift over time.
 */
export function generateWashDates(config: ScheduleConfig, horizonDate: Date): string[] {
  const skip = new Set(config.skipDates ?? []);
  const weekdays = config.weekdays ?? [];
  const results: string[] = [];

  let cursor = parseISODate(config.startDate);
  let guard = 0;
  const maxIterations = 2000; // safety valve against pathological configs

  while (cursor.getTime() <= horizonDate.getTime() && guard < maxIterations) {
    guard++;
    let next = addDays(cursor, config.intervalDays);
    if (weekdays.length > 0) next = snapToNearestWeekday(next, weekdays);

    let skipGuard = 0;
    while (skip.has(toISODate(next)) && skipGuard < 30) {
      next = addDays(next, 1);
      if (weekdays.length > 0) next = nextAllowedWeekday(next, weekdays);
      skipGuard++;
    }

    if (next.getTime() > horizonDate.getTime()) break;
    results.push(toISODate(next));
    cursor = next;
  }

  return results;
}
