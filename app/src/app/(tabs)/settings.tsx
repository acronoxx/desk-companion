import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import Button from '@/components/button';
import Screen from '@/components/screen';
import StickerCard from '@/components/sticker-card';
import { useUserId } from '@/hooks/use-user-id';
import { signOut } from '@/services/auth';
import { getDevices, isDeviceOnline, updateDevice } from '@/services/devices';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import type { Device, DeviceSettings } from '@/types/models';

export default function SettingsScreen() {
  const router = useRouter();
  const userId = useUserId();
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      setDevices(await getDevices(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible.');
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (device: Device, key: 'vibration_enabled' | 'led_enabled', value: boolean) => {
    if (!userId) return;
    const settings: Partial<DeviceSettings> = { [key]: value };
    try {
      const updated = await updateDevice(userId, device.id, { settings: settings as DeviceSettings });
      setDevices((current) => current.map((d) => (d.id === updated.id ? updated : d)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Modification impossible.');
    }
  };

  const logout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Déconnexion impossible.');
    }
  };

  return (
    <Screen eyebrow="Mon espace" title="Réglages">
      {error && <Text style={styles.error}>{error}</Text>}

      <StickerCard>
        <View style={styles.heading}>
          <Text style={styles.cardTitle}>Mes appareils</Text>
          <Text style={styles.count}>{devices.filter(isDeviceOnline).length} connectés</Text>
        </View>
        {devices.length === 0 && <Text style={styles.empty}>Aucun appareil pour le moment.</Text>}
        {devices.map((device) => (
          <View key={device.id} style={styles.device}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <View style={styles.status}>
                <View
                  style={[styles.statusDot, { backgroundColor: isDeviceOnline(device) ? Colors.green : Colors.line }]}
                />
                <Text style={styles.small}>{isDeviceOnline(device) ? 'En ligne' : 'Hors ligne'}</Text>
              </View>
            </View>
            <View style={styles.setting}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Switch
                value={device.settings.vibration_enabled}
                onValueChange={(v) => toggle(device, 'vibration_enabled', v)}
                trackColor={{ true: Colors.green, false: Colors.line }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.setting}>
              <Text style={styles.settingLabel}>Lumière</Text>
              <Switch
                value={device.settings.led_enabled}
                onValueChange={(v) => toggle(device, 'led_enabled', v)}
                trackColor={{ true: Colors.green, false: Colors.line }}
                thumbColor="#fff"
              />
            </View>
          </View>
        ))}
      </StickerCard>

      <Button label="Se déconnecter" variant="secondary" fullWidth onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: Colors.coral, fontFamily: Fonts.bodyBold, textAlign: 'center' },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  cardTitle: { color: Colors.ink, fontSize: 21, fontFamily: Fonts.title },
  count: {
    color: Colors.successText,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 10,
    fontFamily: Fonts.bodyBlack,
    overflow: 'hidden',
  },
  empty: { color: Colors.textMuted, padding: 24, textAlign: 'center' },
  device: { padding: 20, gap: 6, borderBottomWidth: 1, borderBottomColor: Colors.line },
  deviceInfo: { gap: 4, marginBottom: 6 },
  deviceName: { color: Colors.ink, fontSize: 15, fontFamily: Fonts.bodyBold },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  small: { color: Colors.textMuted, fontFamily: Fonts.body, fontSize: 11 },
  setting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { color: Colors.ink, fontFamily: Fonts.body, fontSize: 14 },
});
