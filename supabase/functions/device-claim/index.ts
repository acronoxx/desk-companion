// device-claim — called by the app when the user types the code shown by a device.
//
// Finds the device waiting with this pairing code (user_id = null), links it to the caller,
// names it and clears the code (it can't be used twice). The device learns it is paired
// on its next device-register call.
//
// Request : POST, Authorization: Bearer <user access token>, body { code, name }
// Response: 200 the device row (without secret_hash)
//           400 invalid code or name · 404 no device waiting with this code

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const PAIRING_CODE = /^[0-9]{6}$/;
const MAX_NAME_LENGTH = 40; // same as the field of the app's pairing screen

// Same as DEVICE_COLUMNS in app/src/services/devices.ts: never secret_hash.
const DEVICE_COLUMNS = "id, user_id, serial_number, name, settings, last_seen_at, created_at";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "use POST" }, { status: 405 });
    }
    const body = await req.json().catch(() => null);
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!PAIRING_CODE.test(code)) {
      return Response.json({ error: "The code must have 6 digits." }, { status: 400 });
    }
    if (name === "" || name.length > MAX_NAME_LENGTH) {
      return Response.json({ error: "Invalid name." }, { status: 400 });
    }

    // One query: only matches a device still waiting (user_id null), so two users
    // typing the same code at the same moment can't both get it.
    const { data, error } = await ctx.supabaseAdmin
      .from("devices")
      .update({ user_id: ctx.userClaims!.id, name, pairing_code: null })
      .eq("pairing_code", code)
      .is("user_id", null)
      .select(DEVICE_COLUMNS)
      .maybeSingle();
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: "No device is waiting with this code." }, { status: 404 });
    }
    return Response.json(data);
  }),
};
