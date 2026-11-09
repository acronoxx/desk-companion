import { supabase } from '../lib/supabase';
import type { Device, DeviceSettings } from '../types/database';

/**
 * Links a new device to the user with its 6-digit pairing code.
 * Goes through the device-claim Edge Function (the app cannot insert devices).
 *
 * @param code - The pairing code shown on the device's Wi-Fi setup page.
 * @param name - The name given to the device.
 * @returns The created device.
 * @throws Always, for now: not implemented yet.
 */
export async function claimDevice(code: string, name: string): Promise<Device> {
  throw new Error('Not implemented yet');
}

/**
 * Gets all the devices of a user, sorted by name.
 *
 * @param userId - The user's id (session.user.id).
 * @throws If the network fails.
 */
export async function getDevices(userId: string): Promise<Device[]> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Gets one device of a user.
 *
 * @param userId - The user's id (session.user.id).
 * @param deviceId - The device's id.
 * @throws If the device does not exist or the network fails.
 */
export async function getDevice(userId: string, deviceId: string): Promise<Device> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .eq('id', deviceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Changes the name and/or the settings of a device.
 * The given settings are merged with the current ones, so only the changed keys need to be passed
 * (settings is a single JSON column: sending a partial object would erase the other keys).
 *
 * @param userId - The user's id (session.user.id).
 * @param deviceId - The device's id.
 * @param updates - The new name and/or the settings to change.
 * @returns The updated device.
 * @throws If the device does not exist, a setting is out of range, or the network fails.
 */
export async function updateDevice(
  userId: string,
  deviceId: string,
  updates: Partial<Pick<Device, 'name' | 'settings'>>,
): Promise<Device> {
  const device = await getDevice(userId, deviceId);
  const updatedSettings: DeviceSettings = {
    ...device.settings,
    ...updates.settings,
  };

  const { data, error } = await supabase
    .from('devices')
    .update({ ...updates, settings: updatedSettings })
    .eq('user_id', userId)
    .eq('id', deviceId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Deletes a device. Its reminders are kept, only their links to this device are deleted.
 *
 * @param userId - The user's id (session.user.id).
 * @param deviceId - The device's id.
 * @throws If the network fails.
 */
export async function deleteDevice(userId: string, deviceId: string): Promise<void> {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('user_id', userId)
    .eq('id', deviceId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Tells if a device synced recently. The ESP32 syncs every 30 s.
 *
 * @param device - The device, as returned by getDevices or getDevice.
 * @returns True if it was seen in the last 5 minutes, false if not or if it never connected.
 */
export function isDeviceOnline(device: Device): boolean {
  if (!device.last_seen_at) {
    return false;
  }

  const lastSeen = new Date(device.last_seen_at);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

  return diffInMinutes <= 5;
}
