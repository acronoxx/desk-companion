#pragma once
#include <Arduino.h>
#include <WiFi.h>  // for WiFiMode / WIFI_STA

// Network configuration
constexpr wifi_mode_t WIFI_MODE = WIFI_STA;

// Wi-Fi setup portal (WiFiManager)
constexpr const char *AP_NAME_PREFIX   = "DeskCompanion-";
constexpr uint16_t    PORTAL_TIMEOUT_S = 180;

// Max time to wait for the Wi-Fi connection, in milliseconds.
constexpr uint32_t WIFI_TIMEOUT_MS = 20000;

// Max time to wait for the NTP server to answer, in milliseconds.
constexpr uint32_t NTP_TIMEOUT_MS = 30000;

// Any Unix time before this means the clock hasn't been set by NTP yet
// (the ESP32 starts at 0 = 1970 on every boot). 1788220800 = 2026-09-01 00:00 UTC.
constexpr time_t MIN_VALID_TIME = 1788220800;

constexpr const char *NTP_SERVER_1 = "162.159.200.1";
constexpr const char *NTP_SERVER_2 = "time.nist.gov";

// Alerts configuration
constexpr uint8_t  PIN_LED           = 2;     // built-in LED on most ESP32 DevKits
constexpr uint8_t  PIN_VIBRATION     = 25;    // optional motor, through a transistor, never directly
constexpr bool     VIBRATION_ENABLED = false; // set to true once a motor is wired
constexpr uint32_t ALERT_DURATION_MS = 30000; // how long an alert lasts
constexpr uint32_t ALERT_BLINK_MS    = 300;   // LED on/off half-period during an alert
constexpr uint32_t PWM_FREQUENCY_HZ  = 5000;
constexpr uint8_t  PWM_RESOLUTION    = 8;     // bits: duty from 0 to 255

// Sync configuration
constexpr uint32_t SYNC_INTERVAL_MS = 30000; // how often the device asks for its reminders
constexpr uint16_t HTTP_TIMEOUT_MS  = 5000;  // max wait for the server's answer
constexpr size_t   MAX_REMINDERS    = 20;    // reminders kept in RAM

// Edge Function paths
constexpr const char *REGISTER_PATH = "/functions/v1/device-register";
constexpr const char *SYNC_PATH     = "/functions/v1/device-sync";