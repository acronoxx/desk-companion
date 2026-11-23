-- Desk Companion — Supabase database schema (PostgreSQL)
-- Paste into Supabase > SQL Editor, or run with `supabase db push`.
-- The matching diagram is in database/schema.md.

-- ---------------------------------------------------------------------------
-- Users
-- Supabase already manages accounts (email, password...) in auth.users.
-- Here we only keep app-specific info, linked 1-1 to the account.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
               check (char_length(btrim(display_name)) > 0),
  created_at   timestamptz not null default now()
);

-- Automatically creates the profile when someone signs up.
-- display_name is the first name typed at signup (sent in the user metadata by the app).
-- Without one (account created from the dashboard), it falls back to the part of the email
-- before the @ (alice.martin@school.fr → alice.martin). The user can change it later in the app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Physical devices (ESP32)
-- A user can own several devices, a device belongs to a single user.
-- The ESP32 creates its own row on first boot (Edge Function device-register),
-- before being paired: user_id stays null until then.
-- ---------------------------------------------------------------------------
create table public.devices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles (id) on delete cascade,  -- null until paired
  name          text not null default 'My desk companion',
  serial_number text not null unique,   -- e.g. the ESP32 MAC address
  secret_hash   text not null,          -- sha256 (hex) of the secret the ESP32 generated itself
  -- 6 digits the ESP32 generated itself and shows on its Wi-Fi setup page.
  -- The user types it in the app (device-claim), which sets user_id and clears it.
  pairing_code  text unique check (pairing_code ~ '^[0-9]{6}$'),
  last_seen_at  timestamptz,            -- updated every time the ESP32 connects
  -- Settings edited in the app, read by the ESP32. Same keys as DeviceSettings in
  -- app/src/types/models.ts: every key must be in the default, the app expects all of them.
  -- Stored as JSON so a setting can be added without changing the table.
  settings      jsonb not null default '{
                  "vibration_enabled": true,
                  "vibration_intensity": 50,
                  "vibration_duration": 2,
                  "led_enabled": true,
                  "led_color": "#ffd83d",
                  "led_brightness": 70
                }'::jsonb
                check (jsonb_typeof(settings) = 'object')
                check ((settings ->> 'vibration_intensity')::int between 0 and 100),
  created_at    timestamptz not null default now()
);

create index devices_user_id_idx on public.devices (user_id);

-- ---------------------------------------------------------------------------
-- Reminders
-- A reminder belongs to a user. It can be shown on zero, one or several of
-- their devices (reminder_devices table). Zero devices = reminder only visible
-- in the app.
-- ---------------------------------------------------------------------------
create type public.recurrence as enum ('daily', 'weekly', 'monthly', 'yearly');

create table public.reminders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  title        text not null
               check (char_length(btrim(title)) > 0 and char_length(title) <= 50),
  details      text,                    -- optional
  due_at       timestamptz not null,    -- deadline / next occurrence
  remind_at    timestamptz not null,    -- when the device alerts (before or at the deadline)
  recurrence   public.recurrence,       -- null = one-off reminder
  -- Only with 'weekly': the days it repeats on, ISO numbers (1 = Monday ... 7 = Sunday),
  -- in the user's local time. null = same day of the week as due_at.
  -- e.g. {7} = every Sunday, {4,5} = every Thursday and Friday.
  recurrence_days smallint[]
               check (recurrence_days is null or (
                 recurrence = 'weekly'
                 and cardinality(recurrence_days) between 1 and 7
                 and recurrence_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
               )),
  completed_at timestamptz,             -- null = not done yet (always null for a recurring reminder)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (remind_at <= due_at)
);

create index reminders_user_id_due_at_idx on public.reminders (user_id, due_at);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- Reminder <-> device link (many-to-many)
create table public.reminder_devices (
  reminder_id uuid not null references public.reminders (id) on delete cascade,
  device_id   uuid not null references public.devices (id) on delete cascade,
  primary key (reminder_id, device_id)
);

-- The ESP32 will ask for "my upcoming reminders": this index serves that query
create index reminder_devices_device_id_idx on public.reminder_devices (device_id);

-- ---------------------------------------------------------------------------
-- Security (Row Level Security): each user only sees their own data
-- (select auth.uid()) instead of auth.uid(): evaluated once per query, not per row.
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.devices          enable row level security;
alter table public.reminders        enable row level security;
alter table public.reminder_devices enable row level security;

-- The profile is created by the trigger and deleted with the account: the app only reads and updates it.
create policy "Read own profile" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "Update own profile" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- No insert policy: a device is only created by pairing (Edge Function),
-- otherwise anyone could claim someone else's serial_number.
create policy "Read own devices" on public.devices
  for select using ((select auth.uid()) = user_id);
create policy "Update own devices" on public.devices
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own devices" on public.devices
  for delete using ((select auth.uid()) = user_id);

create policy "Own reminders" on public.reminders
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- A link is allowed if both the reminder AND the device belong to the user
create policy "Read own reminder links" on public.reminder_devices
  for select using (exists (
    select 1 from public.reminders r
    where r.id = reminder_devices.reminder_id and r.user_id = (select auth.uid())
  ));
create policy "Create own reminder links" on public.reminder_devices
  for insert with check (
    exists (
      select 1 from public.reminders r
      where r.id = reminder_devices.reminder_id and r.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.devices d
      where d.id = reminder_devices.device_id and d.user_id = (select auth.uid())
    )
  );
create policy "Delete own reminder links" on public.reminder_devices
  for delete using (exists (
    select 1 from public.reminders r
    where r.id = reminder_devices.reminder_id and r.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- Mark a reminder as done (called by the app: supabase.rpc('complete_reminder'))
--   - one-off reminder   : completed_at = now()
--   - recurring reminder : due_at and remind_at move forward together, at least once and
--                          until the deadline is in the future. completed_at stays null.
--       daily / weekly / monthly / yearly : by one period at a time;
--       weekly with recurrence_days       : to the next of the chosen days of the week.
-- time_zone: the phone's IANA zone (e.g. 'Europe/Paris'). The dates are moved in local time,
-- so "every Sunday at 9:00" stays on Sunday at 9:00, even across a daylight saving change.
-- Security invoker (the default): RLS applies, so a user can only complete their own reminders.
-- ---------------------------------------------------------------------------
create or replace function public.complete_reminder(reminder_id uuid, time_zone text default 'UTC')
returns public.reminders
language plpgsql
set search_path = ''
as $$
declare
  reminder     public.reminders;
  local_due    timestamp;   -- due_at as read on the phone's clock
  local_remind timestamp;
  step         interval;
  periods      int := 0;
begin
  select * into reminder from public.reminders where id = complete_reminder.reminder_id;
  if not found then
    raise exception 'Reminder % not found', complete_reminder.reminder_id using errcode = 'P0002';
  end if;

  if reminder.recurrence is null then
    update public.reminders set completed_at = now()
    where id = reminder.id
    returning * into reminder;
    return reminder;
  end if;

  local_due    := reminder.due_at    at time zone complete_reminder.time_zone;
  local_remind := reminder.remind_at at time zone complete_reminder.time_zone;

  if reminder.recurrence_days is not null then
    -- Day by day until a chosen day of the week (isodow: 1 = Monday ... 7 = Sunday).
    step := interval '1 day';
    loop
      periods := periods + 1;
      exit when extract(isodow from local_due + step * periods)::smallint = any (reminder.recurrence_days)
        and (local_due + step * periods) at time zone complete_reminder.time_zone > now();
    end loop;
  else
    step := case reminder.recurrence
      when 'daily'   then interval '1 day'
      when 'weekly'  then interval '1 week'
      when 'monthly' then interval '1 month'
      when 'yearly'  then interval '1 year'
    end;

    -- Counted from the current date (not added one by one), so Jan 31 + 2 months = Mar 31.
    loop
      periods := periods + 1;
      exit when (local_due + step * periods) at time zone complete_reminder.time_zone > now();
    end loop;
  end if;

  update public.reminders
  set due_at    = (local_due    + step * periods) at time zone complete_reminder.time_zone,
      remind_at = (local_remind + step * periods) at time zone complete_reminder.time_zone
  where id = reminder.id
  returning * into reminder;
  return reminder;
end;
$$;
