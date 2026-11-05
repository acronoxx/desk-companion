// Shared by the Edge Functions called by the ESP32 (device-register, device-sync).
// Folders starting with "_" are not deployed as functions.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type Device = {
  id: string;
  user_id: string | null; // null until the device is paired with a user
  settings: Record<string, unknown>;
  secret_hash: string;
};

// The two headers every device request carries.
export type DeviceHeaders = { serial: string; secret: string };

// Reads x-device-serial and x-device-secret. Null if one is missing.
export function readDeviceHeaders(req: Request): DeviceHeaders | null {
  const serial = req.headers.get("x-device-serial");
  const secret = req.headers.get("x-device-secret");
  return serial && secret ? { serial, secret } : null;
}

// Hex SHA-256, the same as encode(sha256(...), 'hex') in SQL.
// Only the hash of the secret is stored, never the secret itself.
export async function sha256Hex(text: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Finds a device by serial number. Null if unknown. Throws on database error.
// `admin` must be the service-role client: the device has no user, RLS would hide the row.
export async function findDevice(admin: SupabaseClient, serial: string): Promise<Device | null> {
  const { data, error } = await admin
    .from("devices")
    .select("id, user_id, settings, secret_hash")
    .eq("serial_number", serial)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Returns the device if serial + secret match, null otherwise (→ answer 401).
export async function authenticateDevice(
  admin: SupabaseClient,
  req: Request,
): Promise<Device | null> {
  const headers = readDeviceHeaders(req);
  if (!headers) return null;
  const device = await findDevice(admin, headers.serial);
  if (!device || device.secret_hash !== (await sha256Hex(headers.secret))) return null;
  return device;
}
