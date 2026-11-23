// Helpers for the repeat rule of a reminder (recurrence + recurrence_days).
// Days of the week use the ISO numbers of the database: 1 = Monday ... 7 = Sunday.

import type { Strings } from '@/i18n/en';
import type { Recurrence } from '@/types/models';

/** ISO numbers of the days of the week, Monday first, as shown in the form. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** ISO day of the week of a date, in local time (Sunday = 7, not 0 like getDay). */
export function isoWeekday(date: Date): number {
  return date.getDay() === 0 ? 7 : date.getDay();
}

/** Same days, sorted and without duplicates, e.g. [5, 4, 5] → [4, 5]. */
export function normalizeDays(days: number[]): number[] {
  return [...new Set(days)].sort((a, b) => a - b);
}

/**
 * Short text of a repeat rule, e.g. "Every Sun", "Every Thu, Fri", "Weekdays".
 * Returns null for a one-off reminder.
 *
 * @param texts - t.recurrence of the current language.
 */
export function recurrenceLabel(
  texts: Strings['recurrence'],
  recurrence: Recurrence | null,
  days: number[] | null,
): string | null {
  if (!recurrence) return null;
  if (recurrence !== 'weekly' || !days || days.length === 0) return texts[recurrence];

  const sorted = normalizeDays(days);
  const key = sorted.join(',');
  if (key === '1,2,3,4,5,6,7') return texts.daily;
  if (key === '1,2,3,4,5') return texts.weekdays;
  if (key === '6,7') return texts.weekends;
  return texts.everyDays(sorted.map((iso) => texts.dayShort[iso - 1]).join(', '));
}

/**
 * The first date, from `date` included, that falls on one of `days`, at the same time.
 * e.g. Wednesday 9:00 with [4, 5] → Thursday 9:00. Returns `date` if it is already on one.
 */
export function nextMatchingDay(date: Date, days: number[]): Date {
  const result = new Date(date);
  for (let i = 0; i < 7 && !days.includes(isoWeekday(result)); i++) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}
