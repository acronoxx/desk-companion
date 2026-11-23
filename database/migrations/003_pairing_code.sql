-- Migration 003 — run once in Supabase > SQL Editor, after 002.
-- schema.sql already contains this change for a new database.
--
-- devices.pairing_code: the 6 digits the ESP32 shows on its Wi-Fi setup page.
-- device-register stores it, device-claim (called by the app) matches it, sets user_id
-- and clears it. unique: two waiting devices can't share a code (null is never a duplicate).

alter table public.devices
  add column pairing_code text unique check (pairing_code ~ '^[0-9]{6}$');
