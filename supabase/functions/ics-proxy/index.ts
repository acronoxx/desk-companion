// ics-proxy — called by the app on web only, to download an .ics calendar link.
//
// A browser refuses to read a calendar server's answer when that server doesn't send CORS
// headers (most don't, e.g. school timetables). This function downloads the file server-side
// and returns it with CORS headers. The phone app downloads the links directly.
//
// Only logged-in users can call it (auth "user"), so it is not an open proxy.
//
// Request : POST, Authorization: Bearer <user access token>, body { url }
// Response: 200 the .ics text (text/calendar)
//           400 not an https link · 502 the link failed or is not a calendar

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

/** A timetable for a year is ~350 KB: 5 MB leaves room without letting huge files through. */
const MAX_BYTES = 5_000_000;
const TIMEOUT_MS = 15_000;

/** https only, and a public host name (no localhost or IP address: no access to internal services). */
function parseCalendarUrl(raw: unknown): URL | null {
  if (typeof raw !== "string") return null;
  let url: URL;
  try {
    url = new URL(raw.trim().replace(/^webcal:\/\//i, "https://"));
  } catch {
    return null;
  }
  const host = url.hostname;
  const isIp = /^[\d.]+$/.test(host) || host.includes(":");
  if (url.protocol !== "https:" || !host.includes(".") || isIp || host.endsWith(".local")) {
    return null;
  }
  return url;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req) => {
    if (req.method !== "POST") {
      return Response.json({ error: "use POST" }, { status: 405 });
    }
    const body = await req.json().catch(() => null);
    const url = parseCalendarUrl(body?.url);
    if (!url) {
      return Response.json({ error: "The link must start with https:// or webcal://." }, {
        status: 400,
      });
    }

    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch {
      return Response.json({ error: "The calendar server did not answer." }, { status: 502 });
    }
    if (!response.ok) {
      return Response.json({ error: `The link answered ${response.status}.` }, { status: 502 });
    }

    const text = await response.text();
    if (text.length > MAX_BYTES) {
      return Response.json({ error: "This calendar is too big." }, { status: 502 });
    }
    if (!text.includes("BEGIN:VCALENDAR")) {
      return Response.json({ error: "This link is not a calendar (.ics)." }, { status: 502 });
    }
    return new Response(text, { headers: { "Content-Type": "text/calendar; charset=utf-8" } });
  }),
};
