import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Reminder, ReminderInput } from '@/types/models';
import { useAuth } from './useAuth';
import {
  completeReminder,
  createReminder,
  deleteReminder,
  getReminders,
  setReminderDevices,
  updateReminder,
} from '@/services/reminders';

export type UseRemindersResult = {
  /** Every reminder of the user (done ones included), the most urgent first. */
  reminders: Reminder[];
  isLoading: boolean;
  /** Message to show if loading failed, null otherwise. */
  error: string | null;
  /** Loads the list again (e.g. to see a reminder marked as done on the device). */
  refresh: () => void;
  /** Marks a reminder as done. A recurring reminder moves to its next occurrence instead. */
  complete: (reminderId: string) => Promise<void>;
  /**
   * Creates a reminder from the form fields.
   * deviceIds: the devices that alert (none = only visible in the app).
   */
  create: (input: ReminderInput, deviceIds?: string[]) => Promise<void>;
  /**
   * Changes the fields of a reminder.
   * deviceIds: the new list of devices that alert. Leave it out to keep the current ones.
   */
  update: (
    reminderId: string,
    changes: Partial<ReminderInput>,
    deviceIds?: string[],
  ) => Promise<void>;
  /** Deletes a reminder (its links to devices are deleted too). */
  remove: (reminderId: string) => Promise<void>;
};

const RemindersContext = createContext<UseRemindersResult | undefined>(undefined);

/** Sort order of the list: the most urgent first (ISO dates compare as strings). */
function byDueDate(a: Reminder, b: Reminder): number {
  return a.due_at.localeCompare(b.due_at);
}

/**
 * Loads the reminders of the logged-in user once and shares them with every screen below.
 * An action done on one tab (complete, create...) shows on the others right away.
 * Reloads when the app comes back to the foreground, to catch the changes made by the device.
 * Placed in the root _layout.tsx.
 */
export function RemindersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Changing this number runs the loading effect again. */
  const [reloadCount, setReloadCount] = useState(0);
  const userId = user?.id;

  const refresh = () => setReloadCount((count) => count + 1);

  useEffect(() => {
    if (!userId) return; // logged out: nothing to load

    let isCancelled = false;

    const load = async () => {
      // isLoading is only true for the first load: a refresh keeps the current list on screen.
      setError(null);

      try {
        // true: the Done filter and the calendar need the completed reminders too.
        const data = await getReminders(userId, true);
        if (!isCancelled) {
          setReminders(data);
        }
      } catch {
        if (!isCancelled) {
          setError('Could not load your reminders.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    // A late answer (e.g. after a logout) must not overwrite the state.
    return () => {
      isCancelled = true;
    };
  }, [userId, reloadCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, []);

  // The actions don't catch errors: the screen that called them decides what to show.

  const complete = async (reminderId: string) => {
    const updated = await completeReminder(reminderId);
    // A recurring reminder comes back with a new due_at, so the list is sorted again.
    setReminders((current) =>
      current.map((reminder) => (reminder.id === updated.id ? updated : reminder)).sort(byDueDate),
    );
  };

  const create = async (input: ReminderInput, deviceIds: string[] = []) => {
    if (!userId) return;
    const created = await createReminder(userId, input);
    if (deviceIds.length > 0) await setReminderDevices(created.id, deviceIds);
    setReminders((current) => [...current, created].sort(byDueDate));
  };

  const update = async (
    reminderId: string,
    changes: Partial<ReminderInput>,
    deviceIds?: string[],
  ) => {
    if (!userId) return;
    const updated = await updateReminder(userId, reminderId, changes);
    if (deviceIds) await setReminderDevices(reminderId, deviceIds);
    // due_at may have changed, so the list is sorted again.
    setReminders((current) =>
      current.map((reminder) => (reminder.id === updated.id ? updated : reminder)).sort(byDueDate),
    );
  };

  const remove = async (reminderId: string) => {
    if (!userId) return;
    await deleteReminder(userId, reminderId);
    setReminders((current) => current.filter((reminder) => reminder.id !== reminderId));
  };

  return (
    <RemindersContext.Provider
      value={{ reminders, isLoading, error, refresh, complete, create, update, remove }}>
      {children}
    </RemindersContext.Provider>
  );
}

/**
 * Reads the shared reminders and their actions. Must be used inside <RemindersProvider>.
 * Used by the Today, Reminders and Calendar tabs.
 *
 * @throws If called outside of <RemindersProvider>.
 */
export function useReminders(): UseRemindersResult {
  const context = useContext(RemindersContext);
  if (context === undefined) {
    throw new Error('useReminders must be used inside <RemindersProvider>');
  }
  return context;
}
