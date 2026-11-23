#pragma once
#include <Arduino.h>
#include "types.h"

// Talks to the Supabase Edge Functions "device-register" and "device-sync".
// Every request carries:
//   apikey          : the publishable key (proves the request comes from our clients)
//   x-device-serial : the ESP32 MAC address (who the device is)
//   x-device-secret : a random secret generated on first boot (proves it is really this device)
//   x-device-pairing-code : the 6 digits the user types in the app to pair the device

// Loads the device secret and pairing code from flash, or generates and saves them
// on first boot. Call once at the start of setup(), before connectWifi(): the code is
// shown on the Wi-Fi setup portal. Turns the radio on (WIFI_MODE) first, because the
// hardware random generator is only truly random while it is on.
void syncBegin();

// The 6-digit pairing code ("042917"). Valid after syncBegin().
const char *getPairingCode();

// Calls device-register: creates this device's row on first boot,
// or checks that the server already knows it with this secret.
// Sets `paired` to true once a user typed the pairing code in the app.
// Returns true if the device is registered.
bool registerDevice(bool &paired);

// Sends GET device-sync.
// Fills `body` with the response and returns true on HTTP 200,
// false otherwise (no Wi-Fi, timeout, 401 wrong secret, 5xx...).
bool fetchSyncJson(String &body);

// Parses the device-sync JSON into a new[]-allocated array of Reminder,
// terminated by an entry whose id[0] == '\0'.
// An empty list gives an array with only the terminator (not nullptr).
// Returns nullptr if the JSON is invalid or memory is missing.
// The caller owns the array and must delete[] it.
Reminder *parseReminders(const String &json);
