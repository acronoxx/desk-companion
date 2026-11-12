import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Device, DeviceSettings } from '@/types/models';
import { useAuth } from './useAuth';
import { getDevices, updateDevice } from '@/services/devices';

export type UseDevicesResult = {
  /** The devices paired with the user, sorted by name. */
  devices: Device[];
  isLoading: boolean;
  /** Message to show if loading failed, null otherwise. */
  error: string | null;
  /** Loads the list again (e.g. to update the online status). */
  refresh: () => void;
  /** Changes only the given settings of a device, the others are kept. */
  updateSettings: (deviceId: string, settings: Partial<DeviceSettings>) => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);
  /** Changing this number runs the loading effect again. */
  const [reloadCount, setReloadCount] = useState(0);
  const userId = user?.id;

  const refresh = () => setReloadCount((count) => count + 1);

  useEffect(() => {
    if (!userId) return; // logged out: nothing to load

    let isCancelled = false;

    const load = async () => {
      setError(null);

      try {
        const data = await getDevices(userId);
        if (!isCancelled) {
          setDevices(data);
        }
      } catch {
        if (!isCancelled) {
          setError('Could not load your devices.');
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

  const updateSettings = async (deviceId: string, settings: Partial<DeviceSettings>) => {
    if (!userId) return;
    const updated = await updateDevice(userId, deviceId, { settings });
    setDevices((current) => current.map((device) => (device.id === updated.id ? updated : device)));
  };

  return (
    <DevicesContext.Provider value={{ devices, isLoading, error, refresh, updateSettings }}>
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
