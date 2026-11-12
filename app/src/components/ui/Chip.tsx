import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Feather icon shown before the label. */
  icon?: ComponentProps<typeof Feather>['name'];
  /** checkbox: one of several can be on (devices). radio: one of a group (recurrence). */
  role?: 'checkbox' | 'radio';
};

/** A pill that can be selected. Put several in a row with flexWrap for a choice list. */
export default function Chip({ label, selected, onPress, icon, role = 'radio' }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !selected && styles.chipPressed,
      ]}>
      {icon && <Feather name={icon} size={14} color={selected ? Colors.ink : Colors.textMuted} />}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    borderColor: Colors.ink,
    backgroundColor: Colors.green,
  },
  chipPressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textMuted,
  },
  labelSelected: {
    fontFamily: Fonts.bodyBlack,
    color: Colors.ink,
  },
});
