import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';

type TabBarIconProps = {
  name: ComponentProps<typeof Feather>['name'];
  focused: boolean;
};

/** Icon of a tab. The current tab sits in a small yellow pill. */
export default function TabBarIcon({ name, focused }: TabBarIconProps) {
  return (
    <View style={[styles.pill, focused && styles.pillFocused]}>
      <Feather name={name} size={20} color={focused ? Colors.ink : Colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 44,
    height: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillFocused: {
    backgroundColor: Colors.yellow,
    borderColor: Colors.ink,
  },
});
