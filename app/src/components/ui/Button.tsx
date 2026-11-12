import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type ButtonProps = {
  label: string;
  onPress: () => void;
  /** primary: yellow with a hard shadow. secondary: light, for less important actions. */
  variant?: 'primary' | 'secondary';
  /** Feather icon shown after the label. */
  icon?: ComponentProps<typeof Feather>['name'];
  /** Shows a spinner and blocks presses (e.g. while a request runs). */
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The main button of the app. When pressed it slides into its shadow,
 * like a real key being pushed down.
 */
export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isBlocked = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isBlocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.ink} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          {icon && <Feather name={icon} size={18} color={Colors.ink} />}
        </View>
      )}
    </Pressable>
  );
}

const SHADOW_OFFSET = 4;

const styles = StyleSheet.create({
  // ----- Shape -----
  base: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ----- Variants -----
  primary: {
    backgroundColor: Colors.yellow,
    boxShadow: `${SHADOW_OFFSET}px ${SHADOW_OFFSET}px 0 ${Colors.ink}`,
  },
  secondary: {
    backgroundColor: Colors.surface,
    boxShadow: `${SHADOW_OFFSET}px ${SHADOW_OFFSET}px 0 ${Colors.line}`,
  },

  // ----- States -----
  pressed: {
    transform: [{ translateX: SHADOW_OFFSET / 2 }, { translateY: SHADOW_OFFSET / 2 }],
    boxShadow: `${SHADOW_OFFSET / 2}px ${SHADOW_OFFSET / 2}px 0 ${Colors.ink}`,
  },
  disabled: {
    backgroundColor: Colors.disabled,
    boxShadow: 'none',
  },

  // ----- Content -----
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 16,
    color: Colors.ink,
  },
});
