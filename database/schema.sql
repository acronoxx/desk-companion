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
  display_name text,
  created_at   timestamptz not null default now()
);

-- Automatically creates the profile when someone signs up.
-- display_name comes from the metadata passed at sign-up:
-- supabase.auth.signUp({ email, password, options: { data: { display_name } } })
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Physical devices (ESP32)
-- A user can own several devices, a device belongs to a single user.
-- ---------------------------------------------------------------------------
create table public.devices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  name          text not null default 'My desk companion',
  serial_number text not null unique,   -- e.g. the ESP32 MAC address
  last_seen_at  timestamptz,            -- updated every time the ESP32 connects
  -- Settings edited in the app, read by the ESP32 (e.g. {"vibration_intensity": 50}).
  -- Stored as JSON so a setting can be added without changing the table.
  settings      jsonb not null default '{"vibration_intensity": 50}'::jsonb
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
-- To write: mark a reminder as done (called by the app and by the ESP32)
-- ---------------------------------------------------------------------------
-- complete_reminder(reminder_id uuid) returns public.reminders
--   - one-off reminder   : completed_at = now()
--   - recurring reminder : due_at and remind_at move forward together by one period
--                          (day / week / month / year) until they are in the future,
--                          completed_at stays null
