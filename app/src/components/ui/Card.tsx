import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

type CardProps = {
  children: ReactNode;
  /**
   * panel: light card with a soft green shadow (lists, sections).
   * highlight: yellow card with a strong green shadow (the one thing to look at).
   */
  variant?: 'panel' | 'highlight';
  style?: StyleProp<ViewStyle>;
};

/** A bordered box with a hard offset shadow, the base block of every screen. */
export default function Card({ children, variant = 'panel', style }: CardProps) {
  return <View style={[styles.base, styles[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 22,
    padding: 20,
  },
  panel: {
    backgroundColor: Colors.surface,
    boxShadow: `4px 4px 0 ${Colors.line}`,
  },
  highlight: {
    backgroundColor: Colors.yellow,
    borderWidth: 3,
    boxShadow: `7px 7px 0 ${Colors.green}`,
  },
});
