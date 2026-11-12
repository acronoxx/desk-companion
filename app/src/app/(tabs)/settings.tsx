import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import DeviceRow from '@/components/DeviceRow';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useActionError } from '@/hooks/useActionError';
import { useAuth } from '@/hooks/useAuth';
import { useDevices } from '@/hooks/useDevices';
import { useProfile } from '@/hooks/useProfile';
import { signOut } from '@/services/auth';
import { isDeviceOnline } from '@/services/devices';
import type { DeviceSettings } from '@/types/models';

/** "Camille Martin" → "CM", "camille" → "C". */
function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { devices, error: devicesError, update } = useDevices();
  const { actionError, run } = useActionError();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const name = profile?.display_name ?? 'You';
  const onlineCount = devices.filter(isDeviceOnline).length;

  const handleChangeSettings = (deviceId: string, settings: Partial<DeviceSettings>) =>
    run(() => update(deviceId, { settings }), 'Could not save the setting. Try again.');

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      // On success, AuthProvider receives a null session and the root layout opens the login.
      await signOut();
    } catch {
      setSignOutError('Could not sign out. Check your connection and try again.');
      setIsSigningOut(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader eyebrow="My space" title="Settings" />

      {/* ----- Profile ----- */}
      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name) || '?'}</Text>
        </View>
        <View style={styles.profileTexts}>
          <Text style={styles.profileName}>{name}</Text>
          {user?.email && <Text style={styles.profileEmail}>{user.email}</Text>}
        </View>
      </Card>

      {/* ----- Devices ----- */}
      <Card>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>My devices</Text>
          {devices.length > 0 && <Badge tone="success" label={`${onlineCount} online`} />}
        </View>

        {devicesError && <Notice tone="error" message={devicesError} />}
        {actionError && <Notice tone="error" message={actionError} />}

        {devices.length === 0 ? (
          <Text style={styles.empty}>
            No device paired yet. Turn on your desk companion, then add it with its pairing code.
          </Text>
        ) : (
          devices.map((device, index) => (
            <DeviceRow
              key={device.id}
              device={device}
              onChangeSettings={handleChangeSettings}
              onPress={(deviceId) =>
                router.push({ pathname: '/devices/[id]', params: { id: deviceId } })
              }
              isLast={index === devices.length - 1}
            />
          ))
        )}

        <Button
          label="Add a device"
          icon="plus"
          variant="secondary"
          onPress={() => router.push('/devices/pair')}
          style={styles.addDevice}
        />
      </Card>

      {/* ----- Account ----- */}
      {signOutError && <Notice tone="error" message={signOutError} />}
      <Button
        label="Sign out"
        icon="log-out"
        variant="secondary"
        onPress={handleSignOut}
        loading={isSigningOut}
      />
    </Screen>
  );
}

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  // ----- Profile -----
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.sun,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `3px 3px 0 ${Colors.green}`,
  },
  avatarText: {
    fontFamily: Fonts.title,
    fontSize: 20,
    color: Colors.ink,
  },
  profileTexts: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontFamily: Fonts.title,
    fontSize: 22,
    color: Colors.ink,
  },
  profileEmail: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },

  // ----- Devices -----
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: Fonts.title,
    fontSize: 22,
    color: Colors.ink,
  },
  addDevice: {
    marginTop: 12,
  },
  empty: {
    marginTop: 8,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
  },
});
