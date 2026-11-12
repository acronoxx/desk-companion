// TEMPORARY HOOK: in-memory sample data so the screens can be built and tried.
// Replace the body with the devices service (getDevices, updateDevice) and keep
// the same return type: the screens only depend on it.

import { useSyncExternalStore } from 'react';
import type { Device, DeviceSettings } from '@/types/models';

export type UseDevicesResult = {
  /** The devices paired with the user, sorted by name. */
  devices: Device[];
  isLoading: boolean;
  /** Message to show if loading failed, null otherwise. */
  error: string | null;
  /** Changes only the given settings of a device, the others are kept. */
  updateSettings: (deviceId: string, settings: Partial<DeviceSettings>) => Promise<void>;
};

const DEFAULT_SETTINGS: DeviceSettings = {
  vibration_enabled: true,
  vibration_intensity: 50,
  vibration_duration: 2,
  led_enabled: true,
  led_color: '#ffd83d',
  led_brightness: 70,
};

const SAMPLE_DEVICES: Device[] = [
  {
    id: 'device-1',
    user_id: 'sample-user',
    serial_number: 'DC-0001',
    name: 'Desk companion',
    settings: DEFAULT_SETTINGS,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'device-2',
    user_id: 'sample-user',
    serial_number: 'DC-0002',
    name: 'Bedroom',
    settings: { ...DEFAULT_SETTINGS, led_enabled: false },
    last_seen_at: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

// Shared by every screen, so a change on one tab shows on the others.
let store: Device[] = SAMPLE_DEVICES;
const listeners = new Set<() => void>();

function setDevices(update: (current: Device[]) => Device[]) {
  store = update(store);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDevices(): UseDevicesResult {
  const devices = useSyncExternalStore(subscribe, () => store);

  const updateSettings = async (deviceId: string, settings: Partial<DeviceSettings>) => {
    setDevices((current) =>
      current.map((device) =>
        device.id === deviceId
          ? { ...device, settings: { ...device.settings, ...settings } }
          : device,
      ),
    );
  };

  return { devices, isLoading: false, error: null, updateSettings };
}
