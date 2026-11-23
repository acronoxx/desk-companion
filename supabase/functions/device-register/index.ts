// device-register — called by the ESP32 at boot, then every few seconds until it is paired.
//
// First boot: the device generated a random secret and a 6-digit pairing code; this creates
// its `devices` row with sha256(secret) and the code, not linked to any user yet (user_id = null).
// Next calls: checks the device is known with the same secret and tells it if it is paired.
// The user pairs it by typing the code in the app (device-claim).
//
// Request : POST, headers apikey (publishable key), x-device-serial, x-device-secret,
//           x-device-pairing-code
// Response: 200 { registered: true, paired: boolean }
//           400 missing headers or invalid code · 409 serial already registered with
//           another secret, or pairing code already used by another device

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { findDevice, readDeviceHeaders, sha256Hex } from "../_shared/device.ts";

const PAIRING_CODE = /^[0-9]{6}$/;

export default {
  fetch: withSupabase({ auth: "publishable" }, async (req, ctx) => {
    const headers = readDeviceHeaders(req);
    if (!headers) {
      return Response.json({ error: "missing device headers" }, { status: 400 });
    }
    const pairingCode = req.headers.get("x-device-pairing-code") ?? "";
    if (!PAIRING_CODE.test(pairingCode)) {
      return Response.json({ error: "invalid pairing code" }, { status: 400 });
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
      if (device.user_id !== null) {
        return Response.json({ registered: true, paired: true });
      }
      // Waiting for pairing: keep the stored code equal to the one the device shows
      // (e.g. a row created before pairing codes existed).
      if (device.pairing_code !== pairingCode) {
        const { error } = await ctx.supabaseAdmin
          .from("devices")
          .update({ pairing_code: pairingCode })
          .eq("id", device.id);
        if (error) return insertError(error);
      }
      return Response.json({ registered: true, paired: false });
    }

    // First boot: create the row, not linked to any user yet.
    const { error } = await ctx.supabaseAdmin
      .from("devices")
      .insert({ serial_number: headers.serial, secret_hash: hash, pairing_code: pairingCode });
    if (error) return insertError(error);
    return Response.json({ registered: true, paired: false });
  }),
};

// 23505 = unique violation: the same serial registered at the same moment,
// or another waiting device already shows this pairing code (1 chance in a million).
function insertError(error: { code: string; message: string }): Response {
  const status = error.code === "23505" ? 409 : 500;
  return Response.json({ error: error.message }, { status });
}
