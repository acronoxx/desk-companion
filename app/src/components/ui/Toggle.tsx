import { Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Colors';

type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  /** Read by screen readers, e.g. "Vibration". */
  label: string;
  disabled?: boolean;
};

/** An on/off switch drawn in the app style (the native Switch can't have a border). */
export default function Toggle({ value, onChange, label, disabled = false }: ToggleProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      style={[styles.track, value && styles.trackOn, disabled && styles.disabled]}
    >
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </Pressable>
  );
}

const TRACK_WIDTH = 46;
const THUMB_SIZE = 20;
const PADDING = 2;

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE + PADDING * 2 + 4,
    padding: PADDING,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.disabled,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: Colors.green,
  },
  disabled: {
    opacity: 0.5,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
  },
  thumbOn: {
    transform: [{ translateX: TRACK_WIDTH - THUMB_SIZE - PADDING * 2 - 4 }],
  },
});
