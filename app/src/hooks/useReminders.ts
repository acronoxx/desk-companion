// TEMPORARY HOOK: in-memory sample data so the screens can be built and tried.
// Replace the body with the reminders service (getReminders, createReminder,
// completeReminder) and keep the same return type: the screens only depend on it.

import { useSyncExternalStore } from 'react';
import type { Recurrence, Reminder, ReminderInput } from '@/types/models';

export type UseRemindersResult = {
  /** Every reminder of the user (done ones included), the most urgent first. */
  reminders: Reminder[];
  isLoading: boolean;
  /** Message to show if loading failed, null otherwise. */
  error: string | null;
  /** Marks a reminder as done. A recurring reminder moves to its next occurrence instead. */
  complete: (reminderId: string) => Promise<void>;
  /** Creates a reminder from the form fields. */
  create: (input: ReminderInput) => Promise<void>;
};

const DAYS_BY_RECURRENCE: Record<Recurrence, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

/** Builds an ISO date `dayOffset` days from today at hours:minutes (local time). */
function at(dayOffset: number, hours: number, minutes: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

/** Returns an ISO date `minutes` minutes before `iso`. */
function minus(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() - minutes * 60_000).toISOString();
}

function sample(
  id: string,
  title: string,
  dueAt: string,
  options: Partial<Pick<Reminder, 'details' | 'recurrence' | 'completed_at'>> = {},
): Reminder {
  return {
    id,
    user_id: 'sample-user',
    title,
    details: options.details ?? null,
    due_at: dueAt,
    remind_at: minus(dueAt, 10),
    recurrence: options.recurrence ?? null,
    completed_at: options.completed_at ?? null,
    created_at: at(-3, 8, 0),
    updated_at: at(-3, 8, 0),
  };
}

const SAMPLE_REMINDERS: Reminder[] = [
  sample('1', 'Send the lab report to Lina', at(-1, 18, 0)),
  sample('2', 'Prepare the English presentation', at(0, 10, 30), {
    details: 'Slides + 5 min rehearsal',
  }),
  sample('3', 'Take a break away from the screen', at(0, 15, 30), {
    recurrence: 'daily',
  }),
  sample('4', 'Read chapter 4 of the networks course', at(0, 9, 0), {
    completed_at: at(0, 8, 45),
  }),
  sample('5', 'Book the train to Lyon', at(1, 12, 0)),
  sample('6', 'Water the plants', at(3, 19, 0), { recurrence: 'weekly' }),
];

function byDueDate(a: Reminder, b: Reminder): number {
  return a.due_at.localeCompare(b.due_at);
}

// Shared by every screen, so a change on one tab shows on the others.
let store: Reminder[] = [...SAMPLE_REMINDERS].sort(byDueDate);
const listeners = new Set<() => void>();

function setReminders(update: (current: Reminder[]) => Reminder[]) {
  store = update(store);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReminders(): UseRemindersResult {
  const reminders = useSyncExternalStore(subscribe, () => store);

  const complete = async (reminderId: string) => {
    setReminders((current) =>
      current
        .map((reminder) => {
          if (reminder.id !== reminderId) return reminder;
          if (reminder.recurrence === null) {
            return { ...reminder, completed_at: new Date().toISOString() };
          }
          const shift = DAYS_BY_RECURRENCE[reminder.recurrence] * 24 * 60 * 60_000;
          return {
            ...reminder,
            due_at: new Date(new Date(reminder.due_at).getTime() + shift).toISOString(),
            remind_at: new Date(new Date(reminder.remind_at).getTime() + shift).toISOString(),
          };
        })
        .sort(byDueDate),
    );
  };

  const create = async (input: ReminderInput) => {
    const now = new Date().toISOString();
    const reminder: Reminder = {
      id: String(Date.now()),
      user_id: 'sample-user',
      title: input.title,
      details: input.details ?? null,
      due_at: input.due_at,
      remind_at: input.remind_at,
      recurrence: input.recurrence ?? null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    };
    setReminders((current) => [...current, reminder].sort(byDueDate));
  };

  return { reminders, isLoading: false, error: null, complete, create };
}
