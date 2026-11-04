// Dates are ISO strings in UTC, as returned by Supabase (JSON has no date type).
// Convert with new Date(...) only when displaying them.

export type Profile = {
  id: string;
  display_name: string;
  created_at: string;
};

/** Same values as the recurrence enum in the database. */
export type Recurrence = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Reminder = {
  id: string;
  user_id: string;
  /** 1 to 50 characters. */
  title: string;
  details: string | null;
  /** Deadline. */
  due_at: string;
  /** When the device alerts, always <= due_at. */
  remind_at: string;
  /** null = one-off reminder. */
  recurrence: Recurrence | null;
  /** null = not done yet (always null for a recurring reminder). */
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** The fields the user fills in the reminder form. The others are set by the database. */
export type ReminderInput = Pick<
  Reminder,
  'title' | 'details' | 'due_at' | 'remind_at' | 'recurrence'
>;

export type Device = {
  id: string;
  user_id: string;
  name: string;
  serial_number: string;
  last_seen_at: string | null;
  settings: DeviceSettings;
  created_at: string;
};

export type DeviceSettings = {
  vibration_enabled: boolean;
  vibration_intensity: number;
  vibration_duration: number;
  led_enabled: boolean;
  led_color: string;
  led_brightness: number;
};
