-- Migration 002 — run once in Supabase > SQL Editor, after 001.
-- schema.sql already contains these changes for a new database.
--
-- 1. reminders.recurrence_days: a weekly reminder can repeat on chosen days of the week
--    (every Sunday, every Thursday and Friday...).
-- 2. complete_reminder takes the phone's time zone, to move the dates in local time.
--    The old one-argument version is dropped first: two versions would make supabase.rpc ambiguous.

-- ---------------------------------------------------------------------------
-- 1. Days of the week
-- ---------------------------------------------------------------------------
alter table public.reminders
  add column recurrence_days smallint[]
    check (recurrence_days is null or (
      recurrence = 'weekly'
      and cardinality(recurrence_days) between 1 and 7
      and recurrence_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
    ));

-- ---------------------------------------------------------------------------
-- 2. complete_reminder (same code as in schema.sql)
-- ---------------------------------------------------------------------------
drop function if exists public.complete_reminder(uuid);

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
