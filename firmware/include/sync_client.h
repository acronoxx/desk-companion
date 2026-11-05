#pragma once
#include <Arduino.h>
#include "types.h"

// Talks to the Supabase Edge Functions "device-register" and "device-sync".
// Every request carries:
//   apikey          : the publishable key (proves the request comes from our clients)
//   x-device-serial : the ESP32 MAC address (who the device is)
//   x-device-secret : a random secret generated on first boot (proves it is really this device)

// Loads the device secret from flash, or generates and saves one on first boot.
// Call once in setup(), after the Wi-Fi is connected (the hardware random
// generator is only truly random while the radio is on).
void syncBegin();

// Calls device-register: creates this device's row on first boot,
// or checks that the server already knows it with this secret.
// Returns true if the device is registered.
bool registerDevice();

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
