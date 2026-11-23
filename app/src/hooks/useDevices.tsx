import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Device, DeviceSettings } from '@/types/models';
import { useAuth } from './useAuth';
import { useLanguage } from './useLanguage';
import { claimDevice, deleteDevice, getDevices, updateDevice } from '@/services/devices';

export type UseDevicesResult = {
  /** The devices paired with the user, sorted by name. */
  devices: Device[];
  isLoading: boolean;
  /** Message to show if loading failed, null otherwise. */
  error: string | null;
  /** Loads the list again (e.g. to update the online status). */
  refresh: () => void;
  /** Renames a device and/or changes some of its settings (the other settings are kept). */
  update: (
    deviceId: string,
    updates: { name?: string; settings?: Partial<DeviceSettings> },
  ) => Promise<void>;
  /** Unpairs and deletes a device. Its reminders are kept. */
  remove: (deviceId: string) => Promise<void>;
  /** Pairs a new device with the code shown on its Wi-Fi setup page. */
  claim: (code: string, name: string) => Promise<void>;
};

const DevicesContext = createContext<UseDevicesResult | undefined>(undefined);

/**
 * Loads the devices of the logged-in user once and shares them with every screen below.
 * Reloads when the app comes back to the foreground, so the online status stays fresh.
 * Placed in the root _layout.tsx.
 */
export function DevicesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  /** The message is picked at render time, so it follows the language. */
  const [hasError, setHasError] = useState(false);
  const error = hasError ? t.devices.loadError : null;
  /** Changing this number runs the loading effect again. */
  const [reloadCount, setReloadCount] = useState(0);
  const userId = user?.id;

  const refresh = () => setReloadCount((count) => count + 1);

  useEffect(() => {
    if (!userId) return; // logged out: nothing to load

    let isCancelled = false;

    const load = async () => {
      setHasError(false);

      try {
        const data = await getDevices(userId);
        if (!isCancelled) {
          setDevices(data);
        }
      } catch {
        if (!isCancelled) {
          setHasError(true);
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

  const update = async (
    deviceId: string,
    updates: { name?: string; settings?: Partial<DeviceSettings> },
  ) => {
    if (!userId) return;
    const updated = await updateDevice(userId, deviceId, updates);
    setDevices((current) =>
      current
        .map((device) => (device.id === updated.id ? updated : device))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const remove = async (deviceId: string) => {
    if (!userId) return;
    await deleteDevice(userId, deviceId);
    setDevices((current) => current.filter((device) => device.id !== deviceId));
  };

  const claim = async (code: string, name: string) => {
    const created = await claimDevice(code, name);
    setDevices((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
  };

  return (
    <DevicesContext.Provider value={{ devices, isLoading, error, refresh, update, remove, claim }}>
      {children}
    </DevicesContext.Provider>
  );
}

/**
 * Reads the shared devices and their actions. Must be used inside <DevicesProvider>.
 * Used by the Today and Settings tabs.
 *
 * @throws If called outside of <DevicesProvider>.
 */
export function useDevices(): UseDevicesResult {
  const context = useContext(DevicesContext);
  if (context === undefined) {
    throw new Error('useDevices must be used inside <DevicesProvider>');
  }
  return context;
}
