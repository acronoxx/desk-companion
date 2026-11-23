import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Brand from '@/components/ui/Brand';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useLanguage } from '@/hooks/useLanguage';

type AuthLayoutProps = {
  /** Title inside the card, e.g. "Log in". */
  title: string;
  /** The form fields and buttons. */
  children: ReactNode;
  /** Shown under the card (the link to the other auth screen). */
  footer?: ReactNode;
};

/**
 * Shared frame of the login and signup screens: an aqua band with the logo
 * and the slogan, then the form in a card that overlaps it.
 */
export default function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  return (
    // Aqua only behind the status bar (it continues the hero band). The bottom safe area is not
    // padded here, or it would show aqua under the page: the scroll content takes it instead.
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          // iOS bounces even when everything fits: only scroll when there is more to see.
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}>
          {/* ----- Hero ----- */}
          <View style={styles.hero}>
            <View style={[styles.bubble, styles.bubbleBig]} />
            <View style={[styles.bubble, styles.bubbleSmall]} />
            <Brand size={44} />
            <Text style={styles.slogan}>
              {t.auth.sloganStart}
              <Text style={styles.sloganAccent}>{t.auth.sloganAccent}</Text>
            </Text>
          </View>

          {/* ----- Form card ----- */}
          <View style={styles.card}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <View style={styles.form}>{children}</View>
          </View>

          {footer && <View style={styles.footer}>{footer}</View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.aqua,
  },
  fill: {
    flex: 1,
  },
  // Page color behind everything below the hero, down to the bottom edge of the screen.
  scrollArea: {
    backgroundColor: Colors.bg,
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
  },

  // ----- Hero -----
  hero: {
    backgroundColor: Colors.aqua,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 70,
    borderBottomWidth: 3,
    borderBottomColor: Colors.ink,
    overflow: 'hidden',
    gap: 28,
  },
  bubble: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 99,
  },
  bubbleBig: {
    width: 70,
    height: 70,
    right: 30,
    top: 30,
  },
  bubbleSmall: {
    width: 26,
    height: 26,
    right: 120,
    top: 110,
  },
  slogan: {
    fontFamily: Fonts.title,
    fontSize: 44,
    lineHeight: 46,
    color: Colors.ink,
  },
  sloganAccent: {
    color: Colors.white,
    textShadowColor: Colors.green,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0.1,
  },

  // ----- Form card -----
  card: {
    marginHorizontal: 18,
    marginTop: -44,
    padding: 24,
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.ink,
    borderRadius: 26,
    boxShadow: `8px 8px 0 ${Colors.green}`,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 32,
    color: Colors.ink,
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },

  // ----- Footer -----
  footer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
});
