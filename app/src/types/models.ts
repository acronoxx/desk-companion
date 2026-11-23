// Dates are ISO strings in UTC, as returned by Supabase (JSON has no date type).
// Convert with new Date(...) only when displaying them.
// Generated DB types live in ./database.ts (npx supabase gen types) — never edit that file.

import type { Enums, Tables, TablesInsert } from './database';

export type Recurrence = Enums<'recurrence'>;

export type Profile = Tables<'profiles'>;

/**
 * title: 1 to 50 characters.
 * remind_at: when the device alerts, always <= due_at.
 * recurrence: null = one-off reminder.
 * recurrence_days: only with 'weekly', the ISO days it repeats on (1 = Monday ... 7 = Sunday),
 *   in local time. null = same day of the week as due_at.
 * completed_at: null = not done yet (always null for a recurring reminder).
 */
export type Reminder = Tables<'reminders'>;

/** The fields the user fills in the reminder form. The others are set by the database. */
export type ReminderInput = Pick<
  TablesInsert<'reminders'>,
  'title' | 'details' | 'due_at' | 'remind_at' | 'recurrence' | 'recurrence_days'
>;

/** Shape of the `settings` jsonb column (not enforced by the database). */
export type DeviceSettings = {
  vibration_enabled: boolean;
  vibration_intensity: number;
  vibration_duration: number;
  led_enabled: boolean;
  led_color: string;
  led_brightness: number;
};

/** A device as the app sees it: no secret, typed settings. user_id is null until paired. */
export type Device = Omit<Tables<'devices'>, 'secret_hash' | 'settings'> & {
  settings: DeviceSettings;
};

/** Link between a reminder and one of the devices that should alert. */
export type ReminderDevice = Tables<'reminder_devices'>;

// ----- Outside calendars (read-only, never stored in Supabase) -----

/** A calendar of the phone (Google, iCloud, Outlook... account set up on the phone). */
export type PhoneCalendar = {
  id: string;
  title: string;
  /** The account it comes from, e.g. "iCloud" or an email address. */
  accountName: string;
  color: string;
};

/** A subscription link to an .ics file. */
export type IcsFeed = {
  id: string;
  /** Name chosen by the user, e.g. "School timetable". */
  name: string;
  /** https:// or webcal:// link. */
  url: string;
};

/** The calendars the user linked, saved on the phone. */
export type CalendarSettings = {
  /** Ids of the phone calendars to show. */
  phoneCalendarIds: string[];
  icsFeeds: IcsFeed[];
};

/** One occurrence of an event of an outside calendar. start and end are ISO strings. */
export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  /** The whole day: no time to show. end is then the next midnight. */
  allDay: boolean;
  location: string | null;
  /** Name of the calendar or link it comes from. */
  calendarName: string;
  color: string;
};
