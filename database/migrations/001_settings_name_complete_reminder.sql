-- Migration 001 — run once in Supabase > SQL Editor, on a database created with an older schema.sql.
-- schema.sql already contains these changes for a new database.
--
-- 1. devices.settings: the default now has every key of DeviceSettings, existing rows get the
--    missing keys (the values already set are kept).
-- 2. handle_new_user: the profile takes the first name typed at signup instead of the email.
-- 3. complete_reminder: marks a reminder as done, or moves a recurring one to its next occurrence.

-- ---------------------------------------------------------------------------
-- 1. Device settings
-- ---------------------------------------------------------------------------
alter table public.devices
  alter column settings set default '{
    "vibration_enabled": true,
    "vibration_intensity": 50,
    "vibration_duration": 2,
    "led_enabled": true,
    "led_color": "#ffd83d",
    "led_brightness": 70
  }'::jsonb;

-- default || current: the keys of the right side win, so the existing values are kept.
update public.devices
set settings = '{
    "vibration_enabled": true,
    "vibration_intensity": 50,
    "vibration_duration": 2,
    "led_enabled": true,
    "led_color": "#ffd83d",
    "led_brightness": 70
  }'::jsonb || settings;

-- ---------------------------------------------------------------------------
-- 2. Display name from the signup form
-- ---------------------------------------------------------------------------
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

-- Profiles created before this fix: take the first name from the metadata when there is one.
update public.profiles p
set display_name = btrim(u.raw_user_meta_data ->> 'display_name')
from auth.users u
where u.id = p.id
  and nullif(btrim(u.raw_user_meta_data ->> 'display_name'), '') is not null;

-- ---------------------------------------------------------------------------
-- 3. complete_reminder (same code as in schema.sql)
-- ---------------------------------------------------------------------------
create or replace function public.complete_reminder(reminder_id uuid)
returns public.reminders
language plpgsql
set search_path = ''
as $$
declare
  reminder public.reminders;
  step     interval;
  periods  int := 0;
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

  step := case reminder.recurrence
    when 'daily'   then interval '1 day'
    when 'weekly'  then interval '1 week'
    when 'monthly' then interval '1 month'
    when 'yearly'  then interval '1 year'
  end;

  -- Counted from the current date (not added one by one), so Jan 31 + 2 months = Mar 31.
  loop
    periods := periods + 1;
    exit when reminder.due_at + step * periods > now();
  end loop;

  update public.reminders
  set due_at    = reminder.due_at + step * periods,
      remind_at = reminder.remind_at + step * periods
  where id = reminder.id
  returning * into reminder;
  return reminder;
end;
$$;
