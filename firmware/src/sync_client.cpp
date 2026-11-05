#include "sync_client.h"
#include <new>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include "config.h"
#include "secrets.h"

// Where the secret is kept in flash (NVS). It survives reboots and re-flashing
// the firmware, but not a full flash erase (pio run -t erase).
static const char *NVS_NAMESPACE = "device";
static const char *NVS_SECRET    = "secret";
static const size_t SECRET_BYTES = 32;

static String deviceSecret;

void syncBegin() {
    Preferences prefs;
    prefs.begin(NVS_NAMESPACE, false);
    deviceSecret = prefs.getString(NVS_SECRET, "");

    if (deviceSecret.isEmpty()) {
        char hex[SECRET_BYTES * 2 + 1];
        for (size_t i = 0; i < SECRET_BYTES; ++i) {
            snprintf(hex + 2 * i, 3, "%02x", (uint8_t)esp_random());
        }
        deviceSecret = hex;
        prefs.putString(NVS_SECRET, deviceSecret);
        Serial.println("New device secret generated");
    }
    prefs.end();

    Serial.print("Device serial: ");
    Serial.println(WiFi.macAddress());
}

// Sends a request to an Edge Function with the device headers.
// Returns the HTTP status (negative = connection error, see HTTPClient.h).
// If body is not null and the status is 200, fills it with the response.
static int deviceRequest(const char *path, bool post, String *body) {
    if (WiFi.status() != WL_CONNECTED) {
        return HTTPC_ERROR_NOT_CONNECTED;
    }

    // Declared before http: it must live as long as http uses it.
    WiFiClientSecure client;
    client.setInsecure(); // TODO: replace with setCACert before release

    HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    String url = String(SUPABASE_URL) + path;
    if (!http.begin(client, url)) {
        Serial.printf("%s: invalid URL\n", path);
        return HTTPC_ERROR_CONNECTION_REFUSED;
    }

    http.addHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
    http.addHeader("x-device-serial", WiFi.macAddress());
    http.addHeader("x-device-secret", deviceSecret);

    int code = post ? http.POST("") : http.GET();
    if (code == HTTP_CODE_OK) {
        if (body != nullptr) {
            *body = http.getString();
        }
    } else if (code < 0) {
        // Connection problem: no answer from the server
        Serial.printf("%s failed: %s\n", path, http.errorToString(code).c_str());
    } else {
        // The server answered with an error (401, 409, 500...): print its message
        Serial.printf("%s failed: HTTP %d %s\n", path, code, http.getString().c_str());
    }

    http.end();
    return code;
}

bool registerDevice() {
    return deviceRequest(REGISTER_PATH, true, nullptr) == HTTP_CODE_OK;
}

bool fetchSyncJson(String &body) {
    return deviceRequest(SYNC_PATH, false, &body) == HTTP_CODE_OK;
}

Reminder *parseReminders(const String &json) {
    // Only keep the fields the device needs
    JsonDocument filter;
    filter["reminders"][0]["id"]        = true;
    filter["reminders"][0]["remind_at"] = true;

    JsonDocument doc;
    DeserializationError err =
        deserializeJson(doc, json, DeserializationOption::Filter(filter));
    if (err) {
        Serial.printf("device-sync: invalid JSON (%s)\n", err.c_str());
        return nullptr;
    }

    JsonArray arr = doc["reminders"];
    if (arr.isNull()) {
        Serial.println("device-sync: no \"reminders\" field");
        return nullptr;
    }

    size_t count = arr.size();
    if (count > MAX_REMINDERS) {
        count = MAX_REMINDERS;
    }

    // +1 for the terminator. nothrow: returns nullptr instead of crashing if RAM is full.
    Reminder *list = new (std::nothrow) Reminder[count + 1];
    if (list == nullptr) {
        return nullptr;
    }

    size_t i = 0;
    for (JsonObject item : arr) {
        if (i >= count) {
            break;
        }
        const char *id = item["id"] | "";
        if (id[0] == '\0') {
            continue; // skip an entry without id
        }
        strlcpy(list[i].id, id, sizeof(list[i].id));
        list[i].remindAt = item["remind_at"].as<time_t>();
        list[i].alerted  = false;
        ++i;
    }
    list[i].id[0] = '\0';

    return list;
}
