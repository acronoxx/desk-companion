#include "reminders.h"
#include "config.h"

static Reminder *reminders = nullptr;

// Refreshes the list.
// Returns false if the update failed (the old list is kept).
bool updateReminders() {
    Reminder* oldReminders = reminders;

    Reminder* newReminders = nullptr; //TODO
    if (newReminders == nullptr) {
        return false;
    }

    // Keep the "alerted" flag of the reminders that were already in the old list.
    for (Reminder* newR = newReminders; newR->id[0] != '\0'; ++newR) {
        newR->alerted = false;

        if (oldReminders == nullptr) {
            continue;
        }

        for (const Reminder* oldR = oldReminders; oldR->id[0] != '\0'; ++oldR) {
            if (strcmp(newR->id, oldR->id) == 0) {
                newR->alerted = oldR->alerted;
                break;
            }
        }
    }
    delete[] oldReminders;
    reminders = newReminders;
    return true;
}

// Returns the first reminder that is due (remindAt <= now) and not alerted yet,
// or nullptr if there is none.
const Reminder *getDueReminder(time_t now){
    if (reminders == nullptr) {
        return nullptr;
    }

    for (const Reminder* r = reminders; r->id[0] != '\0'; ++r) {
        if (!r->alerted && r->remindAt <= now) {
            return r;
        }
    }
    return nullptr;
}

// Marks a reminder as alerted, so getDueReminder doesn't return it again.
void markAlerted(const char *id){
    if (reminders == nullptr) {
        return;
    }

    for (Reminder* r = reminders; r->id[0] != '\0'; ++r) {
        if (strcmp(r->id, id) == 0) {
            r->alerted = true;
            break;
        }
    }
}

// Debug: prints the whole list on Serial.
void printReminders(){
    if (reminders == nullptr) {
        Serial.println("No reminders available.");
        return;
    }

    Serial.println("Reminders:");
    for (const Reminder* r = reminders; r->id[0] != '\0'; ++r) {
        Serial.print("ID: ");
        Serial.print(r->id);
        Serial.print(", Remind At: ");
        Serial.print(r->remindAt);
        Serial.print(", Alerted: ");
        Serial.println(r->alerted ? "Yes" : "No");
    }
}
