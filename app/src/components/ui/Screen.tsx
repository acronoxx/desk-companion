import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

type ScreenProps = {
  children: ReactNode;
  /** Wraps the content in a ScrollView. Turn it off when the screen has its own list. */
  scroll?: boolean;
};

/**
 * The background and margins of a tab screen. Leaves room at the bottom
 * for the floating tab bar.
 */
export default function Screen({ children, scroll = true }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** Height of the floating tab bar + its margin, so the last item is not hidden. */
export const TAB_BAR_SPACE = 110;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: TAB_BAR_SPACE,
    gap: 18,
  },
  fill: {
    flex: 1,
  },
});
