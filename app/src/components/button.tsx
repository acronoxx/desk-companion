import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SHADOW = 4;
const PRESS = 2;

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  if (variant === 'link') {
    return (
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" hitSlop={8}>
        <Text style={[styles.linkText, disabled && styles.disabled]}>{label}</Text>
      </Pressable>
    );
  }

  const isPrimary = variant === 'primary';

  return (
    <View
      style={[
        styles.wrapper,
        fullWidth ? styles.fullWidth : styles.inline,
        disabled && styles.disabled,
        style,
      ]}>
      {/* Ombre pleine décalée (style "sticker") */}
      <View style={styles.shadow} />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.face,
          { backgroundColor: isPrimary ? Colors.yellow : Colors.surface },
          pressed && { transform: [{ translateX: PRESS }, { translateY: PRESS }] },
        ]}>
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginRight: SHADOW,
    marginBottom: SHADOW,
  },
  inline: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  shadow: {
    position: 'absolute',
    top: SHADOW,
    left: SHADOW,
    right: -SHADOW,
    bottom: -SHADOW,
    backgroundColor: Colors.ink,
    borderRadius: 16,
  },
  face: {
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.ink,
    fontSize: 16,
    fontFamily: Fonts.bodyBlack,
  },
  linkText: {
    color: Colors.teal,
    fontSize: 14,
    fontFamily: Fonts.bodyBold,
  },
  disabled: {
    opacity: 0.5,
  },
});
