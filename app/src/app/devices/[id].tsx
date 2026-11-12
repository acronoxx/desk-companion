import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import Stepper from '@/components/ui/Stepper';
import TextField from '@/components/ui/TextField';
import Toggle from '@/components/ui/Toggle';
import TopBar from '@/components/ui/TopBar';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useActionError } from '@/hooks/useActionError';
import { useDevices } from '@/hooks/useDevices';
import { isDeviceOnline } from '@/services/devices';
import type { Device, DeviceSettings } from '@/types/models';

/** Colors the LED can take, from the app palette. */
const LED_COLORS = [
  { value: Colors.yellow, label: 'Yellow' },
  { value: Colors.coral, label: 'Coral' },
  { value: Colors.green, label: 'Green' },
  { value: Colors.aqua, label: 'Aqua' },
  { value: Colors.teal, label: 'Teal' },
  { value: Colors.white, label: 'White' },
];

export default function DeviceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { devices, isLoading } = useDevices();
  const device = devices.find((item) => item.id === id);

  if (!device) {
    return (
      <Screen tabBar={false}>
        <TopBar title="Device" />
        {isLoading ? (
          <ActivityIndicator color={Colors.teal} style={styles.loader} />
        ) : (
          <Card>
            <Text style={styles.emptyTitle}>This device isn’t paired anymore.</Text>
          </Card>
        )}
      </Screen>
    );
  }

  // The key resets the draft if the screen is reused for another device.
  return <DeviceForm key={device.id} device={device} />;
}

/** The editable part, split out so its draft state starts from a loaded device. */
function DeviceForm({ device }: { device: Device }) {
  const { update, remove } = useDevices();
  const { actionError, run } = useActionError();
  const [name, setName] = useState(device.name);
  const [settings, setSettings] = useState<DeviceSettings>(device.settings);
  const [isSaving, setIsSaving] = useState(false);

  const isOnline = isDeviceOnline(device);
  const nameError = name.trim() === '' ? 'Give your device a name.' : null;

  const change = (changes: Partial<DeviceSettings>) =>
    setSettings((current) => ({ ...current, ...changes }));

  const handleSave = async () => {
    if (nameError) return;
    setIsSaving(true);
    const isSaved = await run(
      () => update(device.id, { name: name.trim(), settings }),
      'Could not save the settings. Check your connection and try again.',
    );
    setIsSaving(false);
    if (isSaved) router.back();
  };

  const confirmDelete = () => {
    Alert.alert(
      `Remove “${device.name}”?`,
      'The device will stop alerting. Your reminders are kept. To use it again, pair it with a new code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const isDeleted = await run(() => remove(device.id), 'Could not remove the device.');
            if (isDeleted) router.back();
          },
        },
      ],
    );
  };

  return (
    <Screen tabBar={false}>
      <TopBar
        title="Device"
        right={
          <Badge tone={isOnline ? 'success' : 'muted'} label={isOnline ? 'Online' : 'Offline'} />
        }
      />

      {actionError && <Notice tone="error" message={actionError} />}

      {/* ----- Name ----- */}
      <Card>
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Desk companion"
          maxLength={40}
          error={nameError}
        />
        <Text style={styles.serial}>Serial number: {device.serial_number}</Text>
      </Card>

      {/* ----- Vibration ----- */}
      <Card style={styles.section}>
        <View style={styles.sectionHeading}>
          <Feather name="smartphone" size={18} color={Colors.teal} />
          <Text style={styles.sectionTitle}>Vibration</Text>
          <Toggle
            label="Vibration"
            value={settings.vibration_enabled}
            onChange={(value) => change({ vibration_enabled: value })}
          />
        </View>
        <Stepper
          label="Intensity"
          value={settings.vibration_intensity}
          onChange={(value) => change({ vibration_intensity: value })}
          min={10}
          max={100}
          step={10}
          unit="%"
          disabled={!settings.vibration_enabled}
        />
        <Stepper
          label="Duration"
          value={settings.vibration_duration}
          onChange={(value) => change({ vibration_duration: value })}
          min={1}
          max={10}
          step={1}
          unit=" s"
          disabled={!settings.vibration_enabled}
        />
      </Card>

      {/* ----- Light ----- */}
      <Card style={styles.section}>
        <View style={styles.sectionHeading}>
          <Feather name="sun" size={18} color={Colors.teal} />
          <Text style={styles.sectionTitle}>Light</Text>
          <Toggle
            label="Light"
            value={settings.led_enabled}
            onChange={(value) => change({ led_enabled: value })}
          />
        </View>
        <Stepper
          label="Brightness"
          value={settings.led_brightness}
          onChange={(value) => change({ led_brightness: value })}
          min={10}
          max={100}
          step={10}
          unit="%"
          disabled={!settings.led_enabled}
        />
        <View style={[styles.colors, !settings.led_enabled && styles.disabled]}>
          {LED_COLORS.map((color) => {
            const isSelected = settings.led_color.toLowerCase() === color.value.toLowerCase();
            return (
              <Pressable
                key={color.value}
                onPress={() => change({ led_color: color.value })}
                disabled={!settings.led_enabled}
                accessibilityRole="radio"
                accessibilityLabel={color.label}
                accessibilityState={{ checked: isSelected }}
                style={[
                  styles.swatch,
                  { backgroundColor: color.value },
                  isSelected && styles.swatchSelected,
                ]}>
                {isSelected && <Feather name="check" size={16} color={Colors.ink} />}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Button
        label="Save"
        icon="check"
        onPress={handleSave}
        loading={isSaving}
        disabled={!!nameError}
      />
      <Button
        label="Remove this device"
        icon="trash-2"
        variant="secondary"
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const SWATCH_SIZE = 38;

const styles = StyleSheet.create({
  loader: {
    marginTop: 40,
  },
  emptyTitle: {
    fontFamily: Fonts.title,
    fontSize: 22,
    color: Colors.ink,
  },
  serial: {
    marginTop: 10,
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // ----- Sections -----
  section: {
    gap: 16,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: Fonts.title,
    fontSize: 20,
    color: Colors.ink,
  },
  disabled: {
    opacity: 0.5,
  },

  // ----- LED colors -----
  colors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderColor: Colors.ink,
    boxShadow: `2px 2px 0 ${Colors.ink}`,
  },
});
