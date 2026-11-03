#pragma once
#include <Arduino.h>

// A reminder as the device sees it: only what it needs to alert.
struct Reminder {
    char   id[37];      // Unique identifier (uuid: 36 chars + '\0'), copied into the struct
    time_t remindAt;    // When the reminder should alert (UTC, seconds since 1970)
    bool   alerted;     // Whether the reminder has already been alerted
};
