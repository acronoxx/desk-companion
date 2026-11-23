#pragma once
#include <Arduino.h>

// Connects to the saved Wi-Fi network. If there is none, or it can't be reached
// within WIFI_TIMEOUT_MS, opens the setup portal: an open access point
// "DeskCompanion-XXXX" whose page lets the user pick their network and shows
// `pairingCode` (the code to type in the app).
// Blocks until connected or until the portal times out (PORTAL_TIMEOUT_S).
// Returns true if connected.
bool connectWifi(const char *pairingCode);

// Opens the same access point and page without blocking, while staying connected:
// lets the user read the pairing code when the Wi-Fi was already set up.
// No timeout. Does nothing if it is already open. Call pairingPortalLoop() in loop().
void startPairingPortal(const char *pairingCode);

// Serves the pairing portal's web page. Call often (every loop()) while it is open.
void pairingPortalLoop();

// Closes the pairing portal (once the device is paired). Does nothing if it is closed.
void stopPairingPortal();

// True while the ESP32 is connected to the Wi-Fi.
bool isWifiConnected();

// Gets the current time from an NTP server (UTC). Needs the Wi-Fi.
// Blocks until the time is received or until timeoutMs has elapsed.
// Returns true if the clock is set.
bool syncTime(uint32_t timeoutMs);
