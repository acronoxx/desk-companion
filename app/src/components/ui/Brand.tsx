import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type BrandProps = {
  /** Logo size in px (the height). Defaults to 40. */
  size?: number;
  /** Hides the "Companion" word and only shows the logo. */
  compact?: boolean;
};

/** The app logo, optionally followed by its name. */
export default function Brand({ size = 40, compact = false }: BrandProps) {
  return (
    <View style={styles.row}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ height: size, width: size * LOGO_RATIO }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      {!compact && <Text style={[styles.name, { fontSize: size * 0.52 }]}>Companion</Text>}
    </View>
  );
}

/** Width / height of logo.png. */
const LOGO_RATIO = 1024 / 940;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontFamily: Fonts.title,
    color: Colors.ink,
  },
});
