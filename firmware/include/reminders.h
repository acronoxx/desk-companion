#pragma once
#include <Arduino.h>
#include "types.h"

// Refreshes the list
// Returns false if the update failed (the old list is kept).
bool updateReminders();

// Returns the first reminder that is due (remindAt <= now) and not alerted yet,
// or nullptr if there is none.
const Reminder *getDueReminder(time_t now);

// Marks a reminder as alerted, so getDueReminder doesn't return it again.
void markAlerted(const char *id);

// Debug: prints the whole list on Serial.
void printReminders();
