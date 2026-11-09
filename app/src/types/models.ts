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
 * completed_at: null = not done yet (always null for a recurring reminder).
 */
export type Reminder = Tables<'reminders'>;

/** The fields the user fills in the reminder form. The others are set by the database. */
export type ReminderInput = Pick<
  TablesInsert<'reminders'>,
  'title' | 'details' | 'due_at' | 'remind_at' | 'recurrence'
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