// device-sync — called by the ESP32 every 30 s.
//
// Returns the device settings and its pending reminders (not completed),
// sorted by remind_at. Times are Unix seconds (UTC): no date parsing on the ESP32.
//
// Request : GET, headers apikey (publishable key), x-device-serial, x-device-secret
// Response: 200 { server_time, settings, reminders: [{ id, title, remind_at }] }
//           401 unknown device or wrong secret

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { authenticateDevice } from "../_shared/device.ts";

// Same as MAX_REMINDERS in firmware/include/config.h (what fits in the ESP32's RAM).
const MAX_REMINDERS = 20;

const toUnix = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

export default {
  fetch: withSupabase({ auth: "publishable" }, async (req, ctx) => {
    const device = await authenticateDevice(ctx.supabaseAdmin, req);
    if (!device) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    // Lets the app show when the device was last online.
    await ctx.supabaseAdmin
      .from("devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", device.id);

    // Pending reminders linked to this device (none while it is not paired).
    const { data: rows, error } = await ctx.supabaseAdmin
      .from("reminders")
      .select("id, title, remind_at, reminder_devices!inner(device_id)")
      .eq("reminder_devices.device_id", device.id)
      .is("completed_at", null)
      .order("remind_at")
      .limit(MAX_REMINDERS);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      server_time: Math.floor(Date.now() / 1000),
      settings: device.settings,
      reminders: rows.map((r) => ({
        id: r.id,
        title: r.title,
        remind_at: toUnix(r.remind_at),
      })),
    });
  }),
};
