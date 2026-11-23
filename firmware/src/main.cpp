#include <Arduino.h>
#include "reminders.h"
#include "sync_client.h"
#include "wifi_connection.h"
#include "secrets.h"
#include "config.h"

bool isPaired = false;
bool hasAskedPairing = false;
uint32_t lastPairingTime = 0;
bool hasSynced = false;
uint32_t lastUpdateTime = 0;

void setup() {
    Serial.begin(115200);
    delay(1000); // Wait for serial to initialize

    // Before the Wi-Fi: the setup portal shows the pairing code.
    syncBegin();

    bool isConnected = connectWifi(getPairingCode());
    while (!isConnected) {
        Serial.println("Wi-Fi setup portal timed out, retrying...");
        isConnected = connectWifi(getPairingCode());
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
    pairingPortalLoop();

    // Until a user pairs the device: ask device-register every PAIRING_POLL_MS
    // (right away the first time). Meanwhile the access point stays open,
    // so the user can read the pairing code on its page.
    // If the Wi-Fi dropped, it reconnects by itself (setAutoReconnect): just wait.
    if (!isPaired && isWifiConnected() &&
        (!hasAskedPairing || millis() - lastPairingTime >= PAIRING_POLL_MS)) {
        hasAskedPairing = true;
        lastPairingTime = millis();

        bool paired = false;
        if (registerDevice(paired)) {
            if (paired) {
                isPaired = true;
                stopPairingPortal();
                Serial.println("Device paired");
            } else {
                startPairingPortal(getPairingCode());
            }
        } else {
            Serial.println("Failed to register device");
        }
    }

    // Once paired: every SYNC_INTERVAL_MS (and right away the first time).
    if (isPaired && isWifiConnected() &&
        (!hasSynced || millis() - lastUpdateTime >= SYNC_INTERVAL_MS)) {
        hasSynced = true;
        lastUpdateTime = millis();

        // Sync time with NTP server
        bool isSynced = syncTime(NTP_TIMEOUT_MS);
        if (isSynced) {
            Serial.println("Time synced with NTP server");
        } else {
            Serial.println("Failed to sync time with NTP server");
        }

        // Update reminders
        bool updated = updateReminders();
        if (updated) {
            Serial.println("Reminders updated");
            printReminders();
        } else {
            Serial.println("Failed to update reminders");
        }
    }

    // Alerts
}
