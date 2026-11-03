#include <Arduino.h>
#include "wifi_connection.h"
#include "secrets.h"
#include "config.h"

bool isConnected;
uint32_t lastUpdateTime = 0;

void setup() {
    Serial.begin(115200);
    delay(1000); // Wait for serial to initialize

    isConnected = connectWifi(WIFI_SSID, WIFI_PASSWORD, WIFI_TIMEOUT_MS);
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
}

void loop() {
    if (isConnected && millis() - lastUpdateTime >= WIFI_TIMEOUT_MS) {
        // Perform actions that require a Wi-Fi connection
        lastUpdateTime = millis();

        // Sync time with NTP server
        bool isSynced = syncTime(NTP_TIMEOUT_MS);
        if (isSynced) {
            Serial.println("Time synced with NTP server");
        } else {
            Serial.println("Failed to sync time with NTP server");
        }

        // Update reminders
    }

    // Alerts
}