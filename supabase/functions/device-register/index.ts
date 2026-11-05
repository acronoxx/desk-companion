// device-register — called by the ESP32 at every boot.
//
// First boot: the device generated a random secret; this creates its `devices` row
// with sha256(secret), not linked to any user yet (user_id = null).
// Next boots: checks the device is known with the same secret.
//
// Request : POST, headers apikey (publishable key), x-device-serial, x-device-secret
// Response: 200 { registered: true, paired: boolean }
//           400 missing headers · 409 serial already registered with another secret

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { findDevice, readDeviceHeaders, sha256Hex } from "../_shared/device.ts";

export default {
  fetch: withSupabase({ auth: "publishable" }, async (req, ctx) => {
    const headers = readDeviceHeaders(req);
    if (!headers) {
      return Response.json({ error: "missing device headers" }, { status: 400 });
    }
    const hash = await sha256Hex(headers.secret);

    // Already registered: only accept the same secret, never overwrite it
    // (otherwise anyone knowing the MAC address could take the device over).
    const device = await findDevice(ctx.supabaseAdmin, headers.serial);
    if (device) {
      if (device.secret_hash !== hash) {
        return Response.json(
          { error: "serial already registered with another secret" },
          { status: 409 },
        );
      }
      return Response.json({ registered: true, paired: device.user_id !== null });
    }

    // First boot: create the row, not linked to any user yet.
    const { error } = await ctx.supabaseAdmin
      .from("devices")
      .insert({ serial_number: headers.serial, secret_hash: hash });
    if (error) {
      // 23505 = unique violation: the same serial was registered at the same moment
      const status = error.code === "23505" ? 409 : 500;
      return Response.json({ error: error.message }, { status });
    }
    return Response.json({ registered: true, paired: false });
  }),
};
