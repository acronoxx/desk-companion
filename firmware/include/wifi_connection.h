#pragma once
#include <Arduino.h>

// Connects to the saved Wi-Fi network. If there is none, or it can't be reached
// within WIFI_TIMEOUT_MS, opens the setup portal: an open access point
// "DeskCompanion-XXXX" whose page lets the user pick their network.
// Blocks until connected or until the portal times out (PORTAL_TIMEOUT_S).
// Returns true if connected.
bool connectWifi();

// True while the ESP32 is connected to the Wi-Fi.
bool isWifiConnected();

// Gets the current time from an NTP server (UTC). Needs the Wi-Fi.
// Blocks until the time is received or until timeoutMs has elapsed.
// Returns true if the clock is set.
bool syncTime(uint32_t timeoutMs);