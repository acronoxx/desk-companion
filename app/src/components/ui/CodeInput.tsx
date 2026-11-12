import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type CodeInputProps = {
  value: string;
  /** Called with digits only, at most `length` of them. */
  onChange: (value: string) => void;
  /** Number of digits. Defaults to 6. */
  length?: number;
  label: string;
};

/**
 * A numeric code shown as one box per digit. A single hidden TextInput receives the typing,
 * so pasting and deleting work like in a normal field.
 */
export default function CodeInput({ value, onChange, length = 6, label }: CodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxes} accessible={false}>
        {Array.from({ length }, (_, index) => {
          const isCurrent = isFocused && index === Math.min(value.length, length - 1);
          return (
            <View key={index} style={[styles.box, isCurrent && styles.boxCurrent]}>
              <Text style={styles.digit}>{value[index] ?? ''}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        accessibilityLabel={label}
        style={styles.hiddenInput}
      />
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
  boxes: {
    flexDirection: 'row',
    gap: 8,
  },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxHeight: 64,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxCurrent: {
    borderColor: Colors.teal,
    boxShadow: `0 0 0 3px ${Colors.aqua}`,
  },
  digit: {
    fontFamily: Fonts.title,
    fontSize: 26,
    color: Colors.ink,
  },
  // Kept in the layout (a 0-size input can't get focus on Android) but invisible.
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
