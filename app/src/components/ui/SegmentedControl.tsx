import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type SegmentedControlProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** A row of pills where exactly one is selected (filters, views...). */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={[styles.pill, isSelected && styles.pillSelected]}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: 'transparent',
  },
  pillSelected: {
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.green,
    // Same visual size as the 1px border, so the row does not move.
    paddingHorizontal: 15,
    paddingVertical: 7,
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
