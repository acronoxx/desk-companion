// Outside calendars, shown read-only next to the reminders (nothing is written to Supabase).
//   - phone calendars: every calendar synced on the phone (Google, iCloud, Outlook...), through
//     expo-calendar. The legacy API is used because the new one is not in Expo Go.
//   - .ics links: a subscription URL (Google "secret address in iCal format", iCloud public
//     calendar, school timetable...), downloaded and parsed with ical.js. On web, through the
//     ics-proxy Edge Function: browsers block calendar servers that send no CORS headers.
// The user's choices (which phone calendars, which links) stay on the phone, in AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FunctionsHttpError } from '@supabase/supabase-js';
import * as Calendar from 'expo-calendar/legacy';
import ICAL from 'ical.js';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import type { CalendarEvent, CalendarSettings, IcsFeed, PhoneCalendar } from '../types/models';

/** Color of the events of an .ics link (a link has no color of its own). */
const ICS_COLOR = '#087f8c';

/**
 * Limits of the expansion of a repeating .ics event, which may never end (e.g. a weekly class):
 * occurrences walked through from its first date, and occurrences kept in the window.
 */
const MAX_STEPS = 20_000;
const MAX_OCCURRENCES = 1000;

const EMPTY_SETTINGS: CalendarSettings = { phoneCalendarIds: [], icsFeeds: [] };

function settingsKey(userId: string): string {
  return `calendar-settings:${userId}`;
}

/**
 * Reads the calendars the user linked on this phone.
 *
 * @param userId - The user's id: two accounts on the same phone keep separate choices.
 */
export async function loadCalendarSettings(userId: string): Promise<CalendarSettings> {
  const saved = await AsyncStorage.getItem(settingsKey(userId));
  if (!saved) return EMPTY_SETTINGS;
  return { ...EMPTY_SETTINGS, ...(JSON.parse(saved) as Partial<CalendarSettings>) };
}

/** Saves the calendars the user linked on this phone. */
export async function saveCalendarSettings(
  userId: string,
  settings: CalendarSettings,
): Promise<void> {
  await AsyncStorage.setItem(settingsKey(userId), JSON.stringify(settings));
}

// ---------------------------------------------------------------------------
// Phone calendars
// ---------------------------------------------------------------------------

/** Phone calendars can't be read in a browser. */
export const arePhoneCalendarsSupported = Platform.OS !== 'web';

/**
 * Lists the calendars of the phone. Asks for the permission the first time.
 *
 * @returns The calendars, or null if the user refused the permission.
 */
export async function getPhoneCalendars(): Promise<PhoneCalendar[] | null> {
  const { granted } = await Calendar.requestCalendarPermissionsAsync();
  if (!granted) return null;

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars.map((calendar) => ({
    id: calendar.id,
    title: calendar.title,
    accountName: calendar.source?.name ?? '',
    color: calendar.color,
  }));
}

/**
 * Gets the events of some phone calendars between two dates. Repeating events come back as one
 * event per occurrence. Does not ask for the permission: returns [] if it is not granted yet.
 */
export async function getPhoneEvents(
  calendars: PhoneCalendar[],
  from: Date,
  to: Date,
): Promise<CalendarEvent[]> {
  if (calendars.length === 0) return [];
  const { granted } = await Calendar.getCalendarPermissionsAsync();
  if (!granted) return [];

  const byId = new Map(calendars.map((calendar) => [calendar.id, calendar]));
  const events = await Calendar.getEventsAsync([...byId.keys()], from, to);

  return events.map((event) => {
    const calendar = byId.get(event.calendarId);
    const start = new Date(event.startDate).toISOString();
    return {
      id: `phone:${event.id}:${start}`,
      title: event.title || '', // EventRow shows a translated fallback
      start,
      end: new Date(event.endDate).toISOString(),
      allDay: event.allDay,
      location: event.location || null,
      calendarName: calendar?.title ?? 'Phone',
      color: calendar?.color ?? ICS_COLOR,
    };
  });
}

// ---------------------------------------------------------------------------
// .ics links
// ---------------------------------------------------------------------------

/** webcal:// is the same as https:// (it only tells a computer to open a calendar app). */
export function normalizeIcsUrl(url: string): string {
  return url.trim().replace(/^webcal:\/\//i, 'https://');
}

/**
 * Downloads the text of an .ics link: directly on the phone, through ics-proxy on web.
 *
 * @throws With a message to show if the link fails or is not a calendar.
 */
async function downloadIcs(url: string): Promise<string> {
  if (Platform.OS === 'web') {
    const { data, error } = await supabase.functions.invoke<string>('ics-proxy', {
      body: { url: normalizeIcsUrl(url) },
    });
    if (error) {
      // The function answers { error } with a readable message.
      const body =
        error instanceof FunctionsHttpError ? await error.context.json().catch(() => null) : null;
      throw new Error(body?.error ?? 'Could not reach the calendar.');
    }
    return data ?? '';
  }

  const response = await fetch(normalizeIcsUrl(url));
  if (!response.ok) throw new Error(`The link answered ${response.status}.`);
  const text = await response.text();
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('This link is not a calendar (.ics).');
  return text;
}

/**
 * Downloads an .ics link and returns its events between two dates, one per occurrence.
 * Handles repeating events (RRULE), their moved or cancelled occurrences, and time zones.
 *
 * @throws If the link can't be downloaded (network, wrong URL, proxy not deployed on web)
 *   or is not an iCalendar file.
 */
export async function getIcsEvents(feed: IcsFeed, from: Date, to: Date): Promise<CalendarEvent[]> {
  const text = await downloadIcs(feed.url);

  const root = new ICAL.Component(ICAL.parse(text));
  // The time zones defined in the file must be known before reading the dates.
  for (const timezone of root.getAllSubcomponents('vtimezone')) {
    ICAL.TimezoneService.register(timezone);
  }

  // A moved occurrence is a second VEVENT with the same UID and a RECURRENCE-ID.
  const masters = new Map<string, InstanceType<typeof ICAL.Event>>();
  const exceptions: InstanceType<typeof ICAL.Component>[] = [];
  for (const component of root.getAllSubcomponents('vevent')) {
    if (component.hasProperty('recurrence-id')) {
      exceptions.push(component);
    } else {
      const event = new ICAL.Event(component);
      masters.set(event.uid, event);
    }
  }
  for (const exception of exceptions) {
    const uid = String(exception.getFirstPropertyValue('uid'));
    const master = masters.get(uid);
    if (master) master.relateException(exception);
    else masters.set(`${uid}:${exceptions.indexOf(exception)}`, new ICAL.Event(exception));
  }

  const events: CalendarEvent[] = [];
  const add = (
    uid: string,
    item: InstanceType<typeof ICAL.Event>,
    start: InstanceType<typeof ICAL.Time>,
    end: InstanceType<typeof ICAL.Time>,
  ) => {
    const startDate = start.toJSDate();
    const endDate = end.toJSDate();
    if (endDate < from || startDate > to) return;
    events.push({
      id: `ics:${feed.id}:${uid}:${startDate.toISOString()}`,
      title: item.summary || '',
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay: start.isDate,
      location: item.location || null,
      calendarName: feed.name,
      color: ICS_COLOR,
    });
  };

  for (const [uid, event] of masters) {
    if (!event.isRecurring()) {
      add(uid, event, event.startDate, event.endDate);
      continue;
    }
    // Walked from the first occurrence (the rule is anchored on it), only the window is kept.
    const iterator = event.iterator();
    let kept = 0;
    for (let step = 0; step < MAX_STEPS && kept < MAX_OCCURRENCES; step++) {
      const next = iterator.next();
      if (!next || next.toJSDate() > to) break;
      const details = event.getOccurrenceDetails(next);
      if (details.endDate.toJSDate() < from) continue;
      add(uid, details.item, details.startDate, details.endDate);
      kept++;
    }
  }
  return events;
}
