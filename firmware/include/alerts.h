#pragma once
#include <Arduino.h>

// LED + optional vibration motor. Never blocking: updateAlert() animates.

// Sets up the pins (PWM). Call once in setup().
void alertsBegin();

// Starts an alert: the LED blinks (and the motor vibrates if enabled)
// for ALERT_DURATION_MS, then it stops by itself.
void startAlert();

// Call at every loop(): blinks the LED and stops the alert when its time is up.
void updateAlert();

// Stops the alert now (LED and motor off).
void stopAlert();

// True while an alert is running.
bool isAlerting();
