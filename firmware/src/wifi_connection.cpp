#include <WiFi.h>
#include "wifi_connection.h"
#include "config.h"

// Connects to a WPA2-Personal network (hotspot, home router).
// Blocks until connected or until timeoutMs has elapsed.
// Returns true if connected.
bool connectWifi(const char *ssid, const char *password, uint32_t timeoutMs){
    WiFi.mode(WIFI_MODE);
    WiFi.begin(ssid, password);
    uint32_t startTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startTime < timeoutMs) {
        delay(100);
    }
    Serial.printf("Wi-Fi status: %d\n", WiFi.status());
    bool isConnected = WiFi.status() == WL_CONNECTED;
    if (isConnected) {
        WiFi.setAutoReconnect(true);
    }
    if (!isConnected) {
        WiFi.disconnect();
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