import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type TextLinkProps = {
  label: string;
  onPress: () => void;
};

/** A button that looks like a link, for secondary actions ("See all", "Sign up"...). */
export default function TextLink({ label, onPress }: TextLinkProps) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="link">
      {({ pressed }) => <Text style={[styles.label, pressed && styles.pressed]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 14,
    color: Colors.teal,
  },
  pressed: {
    color: Colors.tealDark,
    textDecorationLine: 'underline',
  },
});
