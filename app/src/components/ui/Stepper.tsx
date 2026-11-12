import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** Shown after the value, e.g. "%" or " s". */
  unit?: string;
  disabled?: boolean;
};

/** A number with − and + buttons, kept between min and max. */
export default function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = '',
  disabled = false,
}: StepperProps) {
  const change = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <View
      style={[styles.row, disabled && styles.disabled]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: `${value}${unit}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) =>
        change(event.nativeEvent.actionName === 'increment' ? step : -step)
      }>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <StepButton
          icon="minus"
          onPress={() => change(-step)}
          disabled={disabled || value <= min}
        />
        <Text style={styles.value}>
          {value}
          {unit}
        </Text>
        <StepButton icon="plus" onPress={() => change(step)} disabled={disabled || value >= max} />
      </View>
    </View>
  );
}

type StepButtonProps = {
  icon: 'minus' | 'plus';
  onPress: () => void;
  disabled: boolean;
};

function StepButton({ icon, onPress, disabled }: StepButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}>
      <Feather name={icon} size={16} color={disabled ? Colors.textLight : Colors.ink} />
    </Pressable>
  );
}

const BUTTON_SIZE = 34;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  value: {
    minWidth: 48,
    textAlign: 'center',
    fontFamily: Fonts.bodyBlack,
    fontSize: 15,
    color: Colors.ink,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: Colors.yellow,
  },
  buttonDisabled: {
    borderColor: Colors.line,
  },
});
