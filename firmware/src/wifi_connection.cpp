#include <WiFi.h>
#include <WiFiManager.h>
#include "wifi_connection.h"
#include "config.h"

// "DeskCompanion-EEFF" for the MAC AA:BB:CC:DD:EE:FF: each device has its own
// name, so two devices set up side by side can't be confused.
static String apName() {
    String mac = WiFi.macAddress();
    mac.replace(":", "");
    return String(AP_NAME_PREFIX) + mac.substring(8);
}

// One portal for the whole program: the setup portal (blocking, at boot)
// and the pairing portal (non-blocking, in loop()) are the same WiFiManager.
static WiFiManager wm;

// The big title of the portal's home page.
static void showPairingCode(const char *pairingCode) {
    wm.setTitle(String("Pairing code: ") + pairingCode);
}

// Connects to a WPA2-Personal network (hotspot, home router).
// Blocks until connected or until the portal times out.
// Returns true if connected.
bool connectWifi(const char *pairingCode) {
    WiFi.mode(WIFI_MODE);

    wm.setConnectTimeout(WIFI_TIMEOUT_MS / 1000); // Seconds
    wm.setConfigPortalTimeout(PORTAL_TIMEOUT_S);
    wm.setConfigPortalBlocking(true);
    showPairingCode(pairingCode);

    bool isConnected = wm.autoConnect(apName().c_str());
    if (isConnected) {
        WiFi.setAutoReconnect(true);
    }
    return isConnected;
}

void startPairingPortal(const char *pairingCode) {
    if (wm.getConfigPortalActive()) {
        return;
    }
    wm.setConfigPortalBlocking(false);
    wm.setConfigPortalTimeout(0); // stays open until the device is paired
    showPairingCode(pairingCode);
    // Already connected: WiFiManager keeps the Wi-Fi connection and adds the access point.
    wm.startConfigPortal(apName().c_str());
    Serial.println("Pairing portal open");
}

void pairingPortalLoop() {
    if (wm.getConfigPortalActive()) {
        wm.process();
    }
}

void stopPairingPortal() {
    if (wm.getConfigPortalActive()) {
        wm.stopConfigPortal();
        Serial.println("Pairing portal closed");
    }
}
// True while the ESP32 is connected to the Wi-Fi.
bool isWifiConnected(){
    return WiFi.status() == WL_CONNECTED;
}

// Gets the current time from an NTP server (UTC). Needs the Wi-Fi.
// Blocks until the time is received or until timeoutMs has elapsed.
// Returns true if the clock is set.
bool syncTime(uint32_t timeoutMs){
    configTime(0, 0, NTP_SERVER_1, NTP_SERVER_2);
    uint32_t startTime = millis();
    while (time(nullptr) < MIN_VALID_TIME && millis() - startTime < timeoutMs) {
        delay(100);
    }
    return time(nullptr) >= MIN_VALID_TIME;
}