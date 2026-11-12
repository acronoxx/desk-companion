import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type ScreenHeaderProps = {
  /** Small uppercase text above the title (a date, a context...). */
  eyebrow?: string;
  title: string;
  /** Element on the right of the title (a badge, a button...). */
  right?: ReactNode;
};

/** The big title at the top of a tab screen. */
export default function ScreenHeader({ eyebrow, title, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  texts: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.teal,
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 36,
    lineHeight: 40,
    color: Colors.ink,
  },
});
