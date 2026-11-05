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


// Connects to a WPA2-Personal network (hotspot, home router).
// Blocks until connected or until timeoutMs has elapsed.
// Returns true if connected.
bool connectWifi() {
    WiFi.mode(WIFI_MODE);

    WiFiManager wm;
    wm.setConnectTimeout(WIFI_TIMEOUT_MS / 1000); // Seconds
    wm.setConfigPortalTimeout(PORTAL_TIMEOUT_S);

    bool isConnected = wm.autoConnect(apName().c_str());
    if (isConnected) {
        WiFi.setAutoReconnect(true);
    }
    return isConnected;
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