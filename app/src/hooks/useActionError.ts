import { useState } from 'react';

export type UseActionErrorResult = {
  /** Message of the last failed action, null if the last one worked. */
  actionError: string | null;
  /**
   * Runs an action (complete, create, update...) and catches its error.
   *
   * @param action - The action to run.
   * @param message - What to show if it fails, e.g. "Could not save the reminder.".
   * @returns True if the action worked, false if it failed (actionError is then set).
   */
  run: (action: () => Promise<void>, message: string) => Promise<boolean>;
  /** Hides the message. */
  clearActionError: () => void;
};

/**
 * Turns the errors thrown by the actions of the data hooks into a message the screen can show
 * (they never catch their errors themselves).
 */
export function useActionError(): UseActionErrorResult {
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>, message: string) => {
    setActionError(null);
    try {
      await action();
      return true;
    } catch {
      setActionError(message);
      return false;
    }
  };

  return { actionError, run, clearActionError: () => setActionError(null) };
}
