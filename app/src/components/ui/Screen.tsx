import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

type ScreenProps = {
  children: ReactNode;
  /** Wraps the content in a ScrollView. Turn it off when the screen has its own list. */
  scroll?: boolean;
  /**
   * True for the tab screens: leaves room at the bottom for the floating tab bar.
   * False for the screens opened on top of the tabs (forms...): they get the bottom safe area
   * instead, and the content moves up with the keyboard.
   */
  tabBar?: boolean;
};

/** The background and margins of a screen. */
export default function Screen({ children, scroll = true, tabBar = true }: ScreenProps) {
  const contentStyle = [styles.content, tabBar ? styles.withTabBar : styles.withoutTabBar];

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={tabBar ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={!tabBar}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={contentStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[contentStyle, styles.fill]}>{children}</View>
        )}
      </KeyboardAvoidingView>
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
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 18,
  },
  withTabBar: {
    paddingBottom: TAB_BAR_SPACE,
  },
  withoutTabBar: {
    paddingBottom: 32,
  },
});
