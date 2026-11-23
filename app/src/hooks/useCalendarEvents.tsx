import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { CalendarEvent, CalendarSettings, IcsFeed } from '@/types/models';
import { useAuth } from './useAuth';
import { useLanguage } from './useLanguage';
import {
  arePhoneCalendarsSupported,
  getIcsEvents,
  getPhoneCalendars,
  getPhoneEvents,
  loadCalendarSettings,
  saveCalendarSettings,
} from '@/services/calendars';

export type UseCalendarEventsResult = {
  /** The events of every linked calendar, sorted by start. Read-only. */
  events: CalendarEvent[];
  /** The linked calendars. null while they are read from the phone. */
  settings: CalendarSettings | null;
  /** Error of each .ics link that could not be loaded, by link id. */
  feedErrors: Record<string, string>;
  /** Message to show if the phone calendars could not be read, null otherwise. */
  phoneError: string | null;
  /** Loads the events again. */
  refresh: () => void;
  /** Shows or hides a phone calendar. */
  setPhoneCalendar: (calendarId: string, isShown: boolean) => Promise<void>;
  /**
   * Adds an .ics link. It is downloaded first, so a wrong link is refused right away.
   * @throws With a message to show if the link can't be read.
   */
  addFeed: (name: string, url: string) => Promise<void>;
  removeFeed: (feedId: string) => Promise<void>;
};

const CalendarEventsContext = createContext<UseCalendarEventsResult | undefined>(undefined);

/** Events are loaded from 2 months ago to 12 months ahead (the months the Calendar tab shows). */
function loadWindow(): { from: Date; to: Date } {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 2, 1),
    to: new Date(now.getFullYear(), now.getMonth() + 13, 1),
  };
}

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Loads the events of the outside calendars the user linked on this phone (phone calendars and
 * .ics links) and shares them with every screen below. Reloads when the app comes back to the
 * foreground. Placed in the root _layout.tsx, inside the key that changes with the user.
 */
export function CalendarEventsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [feedErrors, setFeedErrors] = useState<Record<string, string>>({});
  const { t } = useLanguage();
  const [hasPhoneError, setHasPhoneError] = useState(false);
  const phoneError = hasPhoneError ? t.calendars.phoneError : null;
  const [reloadCount, setReloadCount] = useState(0);

  const refresh = () => setReloadCount((count) => count + 1);

  // ----- Read the linked calendars once -----
  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;
    loadCalendarSettings(userId)
      .then((saved) => {
        if (!isCancelled) setSettings(saved);
      })
      .catch(() => {
        if (!isCancelled) setSettings({ phoneCalendarIds: [], icsFeeds: [] });
      });
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  // ----- Load the events each time the settings change or on refresh -----
  useEffect(() => {
    if (!settings) return;
    let isCancelled = false;
    const { from, to } = loadWindow();

    const loadPhone = async (): Promise<CalendarEvent[]> => {
      if (!arePhoneCalendarsSupported || settings.phoneCalendarIds.length === 0) return [];
      try {
        const calendars = (await getPhoneCalendars()) ?? [];
        const shown = calendars.filter((calendar) =>
          settings.phoneCalendarIds.includes(calendar.id),
        );
        const loaded = await getPhoneEvents(shown, from, to);
        if (!isCancelled) setHasPhoneError(false);
        return loaded;
      } catch {
        if (!isCancelled) setHasPhoneError(true);
        return [];
      }
    };

    const loadFeeds = async (): Promise<CalendarEvent[]> => {
      const errors: Record<string, string> = {};
      const results = await Promise.all(
        settings.icsFeeds.map((feed) =>
          getIcsEvents(feed, from, to).catch((error: unknown) => {
            errors[feed.id] = error instanceof Error ? error.message : 'Could not load this link.';
            return [];
          }),
        ),
      );
      if (!isCancelled) setFeedErrors(errors);
      return results.flat();
    };

    Promise.all([loadPhone(), loadFeeds()]).then(([phone, feeds]) => {
      if (isCancelled) return;
      setEvents([...phone, ...feeds].sort((a, b) => a.start.localeCompare(b.start)));
    });
    return () => {
      isCancelled = true;
    };
  }, [settings, reloadCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, []);

  // ----- Actions: change the settings, save them, the effect above reloads -----

  const save = async (next: CalendarSettings) => {
    if (!userId) return;
    await saveCalendarSettings(userId, next);
    setSettings(next);
  };

  const setPhoneCalendar = async (calendarId: string, isShown: boolean) => {
    if (!settings) return;
    const others = settings.phoneCalendarIds.filter((id) => id !== calendarId);
    await save({ ...settings, phoneCalendarIds: isShown ? [...others, calendarId] : others });
  };

  const addFeed = async (name: string, url: string) => {
    if (!settings) return;
    const feed: IcsFeed = {
      id: newId(),
      name: name.trim() || t.calendars.defaultName,
      url: url.trim(),
    };
    // Throws with a readable message if the link is wrong: the screen shows it.
    const { from, to } = loadWindow();
    await getIcsEvents(feed, from, to);
    await save({ ...settings, icsFeeds: [...settings.icsFeeds, feed] });
  };

  const removeFeed = async (feedId: string) => {
    if (!settings) return;
    await save({ ...settings, icsFeeds: settings.icsFeeds.filter((feed) => feed.id !== feedId) });
  };

  return (
    <CalendarEventsContext.Provider
      value={{
        events,
        settings,
        feedErrors,
        phoneError,
        refresh,
        setPhoneCalendar,
        addFeed,
        removeFeed,
      }}>
      {children}
    </CalendarEventsContext.Provider>
  );
}

/**
 * Reads the events of the outside calendars and the actions to link them.
 * Must be used inside <CalendarEventsProvider>.
 *
 * @throws If called outside of <CalendarEventsProvider>.
 */
export function useCalendarEvents(): UseCalendarEventsResult {
  const context = useContext(CalendarEventsContext);
  if (context === undefined) {
    throw new Error('useCalendarEvents must be used inside <CalendarEventsProvider>');
  }
  return context;
}
