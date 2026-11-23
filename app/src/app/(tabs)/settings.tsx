import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import DeviceRow from '@/components/DeviceRow';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import TextField from '@/components/ui/TextField';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useActionError } from '@/hooks/useActionError';
import { useAuth } from '@/hooks/useAuth';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useDevices } from '@/hooks/useDevices';
import { LANGUAGES, useLanguage } from '@/hooks/useLanguage';
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

/** Same limit as the other names of the app (devices). */
const MAX_NAME_LENGTH = 40;

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { profile, updateDisplayName } = useProfile();
  const { devices, error: devicesError, update } = useDevices();
  const { actionError, run } = useActionError();
  const { settings: calendarSettings } = useCalendarEvents();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  /** The name being typed. null = not editing. */
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const name = profile?.display_name ?? t.settings.you;
  const onlineCount = devices.filter(isDeviceOnline).length;
  const linkedCount =
    (calendarSettings?.phoneCalendarIds.length ?? 0) + (calendarSettings?.icsFeeds.length ?? 0);

  const handleChangeSettings = (deviceId: string, settings: Partial<DeviceSettings>) =>
    run(() => update(deviceId, { settings }), t.settings.settingError);

  const startEditingName = () => {
    setNameError(null);
    setNameDraft(profile?.display_name ?? '');
  };

  const handleSaveName = async () => {
    if (nameDraft === null) return;
    const trimmed = nameDraft.trim();
    if (trimmed === '') {
      setNameError(t.settings.nameRequired);
      return;
    }
    setIsSavingName(true);
    try {
      await updateDisplayName(trimmed);
      setNameDraft(null);
      setNameError(null);
    } catch {
      setNameError(t.settings.nameError);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      // On success, AuthProvider receives a null session and the root layout opens the login.
      await signOut();
    } catch {
      setSignOutError(t.settings.signOutError);
      setIsSigningOut(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader eyebrow={t.settings.eyebrow} title={t.settings.title} />

      {/* ----- Profile ----- */}
      {nameDraft === null ? (
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(name) || '?'}</Text>
          </View>
          <View style={styles.profileTexts}>
            <Text style={styles.profileName}>{name}</Text>
            {user?.email && <Text style={styles.profileEmail}>{user.email}</Text>}
          </View>
          <Pressable
            onPress={startEditingName}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t.settings.editName}
            style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}>
            <Feather name="edit-2" size={16} color={Colors.ink} />
          </Pressable>
        </Card>
      ) : (
        <Card style={styles.nameForm}>
          <TextField
            label={t.settings.displayName}
            value={nameDraft}
            onChangeText={setNameDraft}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
            autoComplete="given-name"
            returnKeyType="done"
            onSubmitEditing={handleSaveName}
            error={nameError}
          />
          <View style={styles.nameActions}>
            <Button
              label={t.common.cancel}
              variant="secondary"
              onPress={() => setNameDraft(null)}
              style={styles.nameAction}
            />
            <Button
              label={t.common.save}
              icon="check"
              onPress={handleSaveName}
              loading={isSavingName}
              style={styles.nameAction}
            />
          </View>
        </Card>
      )}

      {/* ----- Language ----- */}
      <Card style={styles.language}>
        <Text style={styles.sectionTitle}>{t.settings.language}</Text>
        <SegmentedControl options={LANGUAGES} value={language} onChange={setLanguage} />
      </Card>

      {/* ----- Devices ----- */}
      <Card>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{t.settings.myDevices}</Text>
          {devices.length > 0 && (
            <Badge tone="success" label={t.settings.onlineBadge(onlineCount)} />
          )}
        </View>

        {devicesError && <Notice tone="error" message={devicesError} />}
        {actionError && <Notice tone="error" message={actionError} />}

        {devices.length === 0 ? (
          <Text style={styles.empty}>{t.settings.noDevice}</Text>
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
          label={t.settings.addDevice}
          icon="plus"
          variant="secondary"
          onPress={() => router.push('/devices/pair')}
          style={styles.addDevice}
        />
      </Card>

      {/* ----- Outside calendars ----- */}
      <Card>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{t.settings.calendars}</Text>
          {linkedCount > 0 && <Badge label={t.settings.linkedBadge(linkedCount)} />}
        </View>
        <Text style={styles.empty}>{t.settings.calendarsHint}</Text>
        <Button
          label={t.settings.linkCalendars}
          icon="calendar"
          variant="secondary"
          onPress={() => router.push('/calendars')}
          style={styles.addDevice}
        />
      </Card>

      {/* ----- Account ----- */}
      {signOutError && <Notice tone="error" message={signOutError} />}
      <Button
        label={t.settings.signOut}
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
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonPressed: {
    backgroundColor: Colors.yellow,
  },
  nameForm: {
    gap: 12,
  },
  nameActions: {
    flexDirection: 'row',
    gap: 10,
  },
  nameAction: {
    flex: 1,
  },

  // ----- Language -----
  language: {
    gap: 12,
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
