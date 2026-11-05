#include "alerts.h"
#include "config.h"

// State of the module, private to this file.
static bool     alerting     = false;
static uint32_t alertStartMs = 0;

void alertsBegin() {
    // TODO: attach PIN_LED to PWM (ledcAttach(pin, frequency, resolution)),
    //       same for PIN_VIBRATION if VIBRATION_ENABLED, then turn both off (ledcWrite(pin, 0))
}

void startAlert() {
    // TODO: remember that an alert is running and when it started (millis())
}

void updateAlert() {
    // TODO: if no alert is running, do nothing
    //       elapsed = millis() - alertStartMs
    //       if elapsed >= ALERT_DURATION_MS: stop the alert
    //       else: LED on or off depending on (elapsed / ALERT_BLINK_MS) % 2
    //             (same for the motor if VIBRATION_ENABLED)
}

void stopAlert() {
    // TODO: alert not running anymore, LED and motor off
}

bool isAlerting() {
    return alerting;
}
