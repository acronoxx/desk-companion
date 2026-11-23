# Database

Supabase database (PostgreSQL). The Expo app writes the reminders, the ESP32 reads them.

- The diagram below renders directly on GitHub, and in VS Code with the *Markdown Preview Mermaid Support* extension.

## Diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "has"
    PROFILES ||--o{ DEVICES : "owns"
    PROFILES ||--o{ REMINDERS : "creates"
    REMINDERS ||--o{ REMINDER_DEVICES : "shown on"
    DEVICES ||--o{ REMINDER_DEVICES : "shows"

    AUTH_USERS {
        uuid id PK
        text email
    }

    PROFILES {
        uuid id PK, FK
        text display_name "first name from the signup"
        timestamptz created_at
    }

    DEVICES {
        uuid id PK
        uuid user_id FK "null until paired"
        text name
        text serial_number UK "ESP32 MAC address"
        text secret_hash "sha256 of the device secret"
        timestamptz last_seen_at
        jsonb settings "settings: vibration intensity..."
        timestamptz created_at
    }

    REMINDERS {
        uuid id PK
        uuid user_id FK
        text title "1 to 50 characters"
        text details "optional"
        timestamptz due_at "deadline"
        timestamptz remind_at "alert time, before or at the deadline"
        recurrence recurrence "null = one-off, else daily / weekly / monthly / yearly"
        smallint[] recurrence_days "weekly only: ISO days, 1 = Mon ... 7 = Sun"
        timestamptz completed_at "null = not done yet"
        timestamptz created_at
        timestamptz updated_at
    }

    REMINDER_DEVICES {
        uuid reminder_id PK, FK
        uuid device_id PK, FK
    }
```

## Tables

| Table | Purpose |
|---|---|
| `auth.users` | Accounts (email, password). Managed by Supabase, we don't touch it. |
| `profiles` | App-specific user info. Created automatically at sign-up. |
| `devices` | The physical devices (ESP32). |
| `reminders` | The reminders. |
| `reminder_devices` | Which devices each reminder is shown on. |

| Relationship | Type |
|---|---|
| account → profile | 1 – 1 |
| user → devices | 1 – many |
| user → reminders | 1 – many |
| reminder ↔ devices | many – many, through `reminder_devices` |

## Profiles

A profile is created by the `on_auth_user_created` trigger (function `handle_new_user`) as soon as an account is created, from the app or from the dashboard. The app never inserts or deletes profiles: the row is deleted with the account (`on delete cascade`).

| Column | Purpose |
|---|---|
| `display_name` | Name shown in the app, never `null` or empty (spaces only counts as empty). The first name typed at signup: the app sends it in the user metadata (`display_name`) and the trigger copies it. Without one (account created from the dashboard), the part of the email before the `@` (`alice.martin@school.fr` → `alice.martin`). |

To change the default, edit `handle_new_user` in `schema.sql`, then run that block again in the SQL Editor (`create or replace function`). Existing profiles are not updated.

## Reminders and devices

A reminder belongs to the user, not to a device. It can be shown on several devices (e.g. one on the desk and one in the bedroom), or on none: it then only shows in the app. Deleting a device does not delete its reminders, only the links.

A reminder is marked as done in the app (devices have no button); it then stops on every device it is shown on, at their next sync.

## Reminders

| Column | Purpose |
|---|---|
| `due_at` | The deadline (e.g. assignment due Monday 11:59 pm). |
| `remind_at` | When the device alerts (e.g. Sunday 6 pm). Always before or equal to `due_at`. |
| `recurrence` | `null` for a one-off reminder, otherwise `daily` / `weekly` / `monthly` / `yearly`. |
| `recurrence_days` | Only with `weekly`: the days of the week it repeats on, ISO numbers in the user's local time (`{7}` = every Sunday, `{4,5}` = every Thursday and Friday). `null` = same day as `due_at`. The app always saves `due_at` on one of these days. |
| `completed_at` | `null` until it is done. |

Marking as done (`complete_reminder(reminder_id, time_zone)` SQL function, called by the app with `supabase.rpc`; `time_zone` is the phone's IANA zone, e.g. `Europe/Paris`):

- **one-off reminder**: `completed_at = now()`, it disappears from the device;
- **recurring reminder**: `due_at` and `remind_at` move forward together, at least once and until the deadline is in the future: by one period, or for a weekly reminder with `recurrence_days`, to the next chosen day. Dates move in local time, so "every Sunday at 9:00" stays at 9:00 across a daylight saving change. `completed_at` stays `null`.

The function runs with the caller's rights, so RLS applies: a user can only complete their own reminders.

The title is 1 to 50 characters long.

## Device settings

A device's settings are stored in `devices.settings`, a JSON object. Current settings:

| Key | Type | Default | Purpose |
|---|---|---|---|
| `vibration_enabled` | boolean | `true` | The device vibrates when a reminder alerts |
| `vibration_intensity` | number 0–100 | `50` | Vibration strength, in % (checked by the database) |
| `vibration_duration` | number | `2` | How long the vibration lasts, in seconds (1 to 10 in the app) |
| `led_enabled` | boolean | `true` | The LED lights up when a reminder alerts |
| `led_color` | text | `"#ffd83d"` | LED color, hex `#rrggbb` |
| `led_brightness` | number | `70` | LED brightness, in % (10 to 100 in the app) |

The default of the column contains every key: the app (`DeviceSettings` in `app/src/types/models.ts`) expects all of them. To add a setting, add it to the default in `schema.sql` **and** in a migration that also fills the existing rows (see `database/migrations/001_…sql`), to `DeviceSettings`, to the ESP32 code, then to this table.

## Dates

Dates are `timestamptz` (date + time with time zone), stored in UTC.

## Security

Each user can only read and change their own rows (Row Level Security).

| Table | The app can... |
|---|---|
| `profiles` | read, update (created by the trigger, deleted with the account) |
| `devices` | read, update, delete. **Not create**: the ESP32 creates its own row (Edge Function `device-register`), otherwise anyone could claim someone else's serial number. |
| `reminders` | everything |
| `reminder_devices` | read, create, delete, only if both the reminder **and** the device belong to the user |

## Device registration

On first boot, the ESP32 generates a random secret, keeps it in its flash memory, and calls `device-register`. The function creates the `devices` row with `user_id = null` and `secret_hash = sha256(secret)`: the secret itself is never stored. A row with `user_id = null` is invisible in the app (RLS).

Every later request (`device-sync`) is accepted only if `sha256(x-device-secret)` matches `secret_hash`.

Until pairing exists, link a device to a user by setting its `user_id` by hand in Supabase (Table Editor or SQL Editor), which bypasses RLS.

If the ESP32's flash is fully erased, it generates a new secret and `device-register` answers `409`: delete the device's row so it can register again.

Migration for an existing database (run once in the SQL Editor; the second line fails if `devices` already has rows):

```sql
alter table public.devices alter column user_id drop not null;
alter table public.devices add column secret_hash text not null;
```
