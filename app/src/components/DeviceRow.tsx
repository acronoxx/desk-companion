import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Toggle from '@/components/ui/Toggle';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { isDeviceOnline } from '@/services/devices';
import type { Device, DeviceSettings } from '@/types/models';

type DeviceRowProps = {
  device: Device;
  onChangeSettings: (deviceId: string, settings: Partial<DeviceSettings>) => void;
  /** Called when the name is pressed (e.g. to open the device screen). */
  onPress?: (deviceId: string) => void;
  /** Hides the bottom separator (for the last row of a list). */
  isLast?: boolean;
};

/** Tells how long ago a device synced, e.g. "Seen 2 days ago". */
function lastSeenLabel(device: Device): string {
  if (!device.last_seen_at) return 'Never connected';

  const minutes = Math.round((Date.now() - new Date(device.last_seen_at).getTime()) / 60_000);
  if (minutes < 60) return `Seen ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Seen ${hours} h ago`;
  const days = Math.round(hours / 24);
  return `Seen ${days} day${days > 1 ? 's' : ''} ago`;
}

/** A paired device: its status and the two alerts it can give (vibration and light). */
export default function DeviceRow({
  device,
  onChangeSettings,
  onPress,
  isLast = false,
}: DeviceRowProps) {
  const isOnline = isDeviceOnline(device);

  return (
    <View style={[styles.row, !isLast && styles.separator]}>
      {/* ----- Name and status ----- */}
      <Pressable
        onPress={onPress ? () => onPress(device.id) : undefined}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityHint={onPress ? 'Opens the device settings' : undefined}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}>
        <View style={styles.icon}>
          <Feather name="box" size={20} color={Colors.ink} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.name}>{device.name}</Text>
          <View style={styles.status}>
            <View
              style={[styles.dot, { backgroundColor: isOnline ? Colors.green : Colors.disabled }]}
            />
            <Text style={styles.statusText}>{isOnline ? 'Online' : lastSeenLabel(device)}</Text>
          </View>
        </View>
        {onPress && <Feather name="chevron-right" size={20} color={Colors.textMuted} />}
      </Pressable>

      {/* ----- Alerts ----- */}
      <View style={styles.options}>
        <View style={styles.option}>
          <Feather name="smartphone" size={16} color={Colors.teal} />
          <Text style={styles.optionLabel}>Vibration</Text>
          <Toggle
            label={`Vibration of ${device.name}`}
            value={device.settings.vibration_enabled}
            onChange={(value) => onChangeSettings(device.id, { vibration_enabled: value })}
          />
        </View>
        <View style={styles.option}>
          <Feather name="sun" size={16} color={Colors.teal} />
          <Text style={styles.optionLabel}>Light</Text>
          <Toggle
            label={`Light of ${device.name}`}
            value={device.settings.led_enabled}
            onChange={(value) => onChangeSettings(device.id, { led_enabled: value })}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 16,
    gap: 14,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },

  // ----- Name and status -----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerPressed: {
    opacity: 0.6,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `2px 2px 0 ${Colors.green}`,
  },
  texts: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 15,
    color: Colors.text,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // ----- Alerts -----
  options: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  optionLabel: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.text,
  },
});
