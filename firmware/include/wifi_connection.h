#pragma once
#include <Arduino.h>

// Connects to a WPA2-Personal network (hotspot, home router).
// Blocks until connected or until timeoutMs has elapsed.
// Returns true if connected.
bool connectWifi(const char *ssid, const char *password, uint32_t timeoutMs);

// True while the ESP32 is connected to the Wi-Fi.
bool isWifiConnected();

// Gets the current time from an NTP server (UTC). Needs the Wi-Fi.
// Blocks until the time is received or until timeoutMs has elapsed.
// Returns true if the clock is set.
bool syncTime(uint32_t timeoutMs);