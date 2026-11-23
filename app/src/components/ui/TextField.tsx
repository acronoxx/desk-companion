import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useLanguage } from '@/hooks/useLanguage';

type TextFieldProps = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  /** Shown under the field in coral, and turns the border coral. */
  error?: string | null;
  /** Hides the text and adds an eye button to show it. */
  password?: boolean;
};

/** A labelled text input. Every other prop is passed to the TextInput. */
export default function TextField({
  label,
  error,
  password = false,
  ...inputProps
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHidden, setIsHidden] = useState(password);
  const { t } = useLanguage();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.box, isFocused && styles.boxFocused, !!error && styles.boxError]}>
        <TextInput
          {...inputProps}
          secureTextEntry={isHidden}
          placeholderTextColor={Colors.textLight}
          style={styles.input}
          onFocus={(event) => {
            setIsFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            inputProps.onBlur?.(event);
          }}
        />
        {password && (
          <Pressable
            onPress={() => setIsHidden(!isHidden)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={isHidden ? t.common.showPassword : t.common.hidePassword}
            style={styles.eye}>
            <Feather name={isHidden ? 'eye' : 'eye-off'} size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 13,
    color: Colors.text,
  },

  // ----- Input box -----
  box: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 14,
    backgroundColor: Colors.white,
  },
  boxFocused: {
    borderColor: Colors.teal,
    boxShadow: `0 0 0 3px ${Colors.aqua}`,
  },
  boxError: {
    borderColor: Colors.coral,
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  eye: {
    paddingHorizontal: 14,
  },

  // ----- Error -----
  error: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.coral,
  },
});
