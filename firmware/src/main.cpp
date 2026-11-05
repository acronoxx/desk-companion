#include <Arduino.h>
#include "reminders.h"
#include "sync_client.h"
#include "wifi_connection.h"
#include "secrets.h"
#include "config.h"

bool isRegistered = false;
bool hasSynced = false;
uint32_t lastUpdateTime = 0;

void setup() {
    Serial.begin(115200);
    delay(1000); // Wait for serial to initialize

    bool isConnected = connectWifi(WIFI_SSID, WIFI_PASSWORD, WIFI_TIMEOUT_MS);
    while(!isConnected) {
        Serial.println("Connecting to Wi-Fi...");
        delay(1000);
        isConnected = connectWifi(WIFI_SSID, WIFI_PASSWORD, WIFI_TIMEOUT_MS);
    }
    Serial.println("Connected to Wi-Fi");

    bool isSynced = syncTime(NTP_TIMEOUT_MS);
    while(!isSynced) {
        Serial.println("Syncing time with NTP server...");
        delay(1000);
        isSynced = syncTime(NTP_TIMEOUT_MS);
    }
    Serial.println("Time synced with NTP server");

    syncBegin();
}

void loop() {
    // Every SYNC_INTERVAL_MS (and right away the first time).
    // If the Wi-Fi dropped, it reconnects by itself (setAutoReconnect): just wait.
    if (isWifiConnected() && (!hasSynced || millis() - lastUpdateTime >= SYNC_INTERVAL_MS)) {
        hasSynced = true;
        lastUpdateTime = millis();

        // Sync time with NTP server
        bool isSynced = syncTime(NTP_TIMEOUT_MS);
        if (isSynced) {
            Serial.println("Time synced with NTP server");
        } else {
            Serial.println("Failed to sync time with NTP server");
        }

        // Register the device (only until it succeeds once per boot)
        if (!isRegistered) {
            isRegistered = registerDevice();
            Serial.println(isRegistered ? "Device registered" : "Failed to register device");
        }

        // Update reminders
        if (isRegistered) {
            bool updated = updateReminders();
            if (updated) {
                Serial.println("Reminders updated");
                printReminders();
            } else {
                Serial.println("Failed to update reminders");
            }
        }
    }

    // Alerts
}
