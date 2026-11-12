import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type BadgeProps = {
  label: string;
  /** yellow: a count to notice. success: something that works (e.g. online). muted: secondary info. */
  tone?: 'yellow' | 'success' | 'muted';
};

/** A small rounded label. */
export default function Badge({ label, tone = 'yellow' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[tone]]}>
      <Text style={[styles.label, tone === 'success' && styles.successLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 2,
  },
  yellow: {
    backgroundColor: Colors.yellow,
    borderColor: Colors.ink,
  },
  success: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
    borderWidth: 1,
  },
  muted: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.line,
    borderWidth: 1,
  },
  label: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 11,
    color: Colors.ink,
  },
  successLabel: {
    color: Colors.successText,
  },
});
