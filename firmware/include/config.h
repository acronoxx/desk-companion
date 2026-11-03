#pragma once
#include <Arduino.h>
#include <WiFi.h>  // for WiFiMode / WIFI_STA

// Network configuration
constexpr wifi_mode_t WIFI_MODE = WIFI_STA;

// Max time to wait for the Wi-Fi connection, in milliseconds.
constexpr uint32_t WIFI_TIMEOUT_MS = 20000;

// Max time to wait for the NTP server to answer, in milliseconds.
constexpr uint32_t NTP_TIMEOUT_MS = 30000;

// Any Unix time before this means the clock hasn't been set by NTP yet
// (the ESP32 starts at 0 = 1970 on every boot). 1788220800 = 2026-09-01 00:00 UTC.
constexpr time_t MIN_VALID_TIME = 1788220800;

constexpr const char *NTP_SERVER_1 = "162.159.200.1";
constexpr const char *NTP_SERVER_2 = "time.nist.gov";
