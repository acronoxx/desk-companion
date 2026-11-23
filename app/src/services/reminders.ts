import { supabase } from '../lib/supabase';
import type { Reminder, ReminderInput } from '../types/models';

/**
 * Creates a reminder for a user.
 *
 * @param userId - The user's id (session.user.id).
 * @param reminder - The fields of the reminder form.
 * @returns The created reminder.
 * @throws If a field is invalid (empty title, remind_at after due_at...) or the network fails.
 */
export async function createReminder(userId: string, reminder: ReminderInput): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .insert({ ...reminder, user_id: userId })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Gets the reminders of a user, the most urgent first.
 *
 * @param userId - The user's id (session.user.id).
 * @param includeCompleted - Also return the reminders already done. Defaults to false.
 * @throws If the network fails.
 */
export async function getReminders(
  userId: string,
  includeCompleted: boolean = false,
): Promise<Reminder[]> {
  let query = supabase.from('reminders').select('*').eq('user_id', userId);

  if (!includeCompleted) {
    query = query.is('completed_at', null);
  }

  const { data, error } = await query.order('due_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Gets one reminder of a user.
 *
 * @param userId - The user's id (session.user.id).
 * @param reminderId - The reminder's id.
 * @throws If the reminder does not exist or the network fails.
 */
export async function getReminder(userId: string, reminderId: string): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('id', reminderId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Changes some fields of a reminder. To mark it as done, use a dedicated function instead
 * (a recurring reminder must move to its next occurrence).
 *
 * @param userId - The user's id (session.user.id).
 * @param reminderId - The reminder's id.
 * @param updates - The fields to change.
 * @returns The updated reminder.
 * @throws If the reminder does not exist, a field is invalid, or the network fails.
 */
export async function updateReminder(
  userId: string,
  reminderId: string,
  updates: Partial<ReminderInput>,
): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', reminderId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Replaces the devices a reminder is shown on: deletes all its links, then creates the new ones.
 * Pass an empty array to show the reminder in the app only.
 *
 * @param reminderId - The reminder's id.
 * @param deviceIds - The ids of the devices to show it on.
 * @throws If a device does not belong to the user, or the network fails.
 */
export async function setReminderDevices(reminderId: string, deviceIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('reminder_devices')
    .delete()
    .eq('reminder_id', reminderId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (deviceIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('reminder_devices')
    .insert(deviceIds.map((deviceId) => ({ reminder_id: reminderId, device_id: deviceId })));

  if (insertError) {
    throw new Error(insertError.message);
  }
}

/**
 * Gets the ids of the devices a reminder is shown on.
 *
 * @param reminderId - The reminder's id.
 * @throws If the network fails.
 */
export async function getReminderDeviceIds(reminderId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('reminder_devices')
    .select('device_id')
    .eq('reminder_id', reminderId);

  if (error) {
    throw new Error(error.message);
  }

  return data.map((link) => link.device_id);
}

/**
 * Marks a reminder as done, through the complete_reminder SQL function:
 * - one-off reminder: completed_at = now, it disappears from the devices;
 * - recurring reminder: due_at and remind_at move to the next occurrence, completed_at stays null.
 * The phone's time zone is sent so the next occurrence is computed in local time
 * ("every Sunday at 9:00" stays on Sunday at 9:00).
 * RLS applies inside the function, so only the user's own reminders can be completed.
 *
 * @param reminderId - The reminder's id.
 * @returns The updated reminder.
 * @throws If the reminder does not exist or the network fails.
 */
export async function completeReminder(reminderId: string): Promise<Reminder> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const { data, error } = await supabase.rpc('complete_reminder', {
    reminder_id: reminderId,
    time_zone: timeZone,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Deletes a reminder. Its links to the devices are deleted with it.
 *
 * @param userId - The user's id (session.user.id).
 * @param reminderId - The reminder's id.
 * @throws If the network fails.
 */
export async function deleteReminder(userId: string, reminderId: string): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('user_id', userId)
    .eq('id', reminderId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Tells if a reminder is done.
 *
 * @param reminder - The reminder, as returned by getReminders or getReminder.
 */
export function isReminderCompleted(reminder: Reminder): boolean {
  return reminder.completed_at !== null;
}
