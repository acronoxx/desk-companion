import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/Colors';

type StickerCardProps = {
  children: ReactNode;
  background?: string;
  shadow?: string;
  radius?: number;
  offset?: number;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** Card with a hard offset shadow, same "sticker" look as the Button. */
export default function StickerCard({
  children,
  background = Colors.surface,
  shadow = Colors.line,
  radius = 24,
  offset = 6,
  borderWidth = 2,
  style,
}: StickerCardProps) {
  return (
    <View style={[{ marginRight: offset, marginBottom: offset }, style]}>
      <View
        style={[
          styles.shadow,
          { top: offset, left: offset, right: -offset, bottom: -offset },
          { backgroundColor: shadow, borderRadius: radius },
        ]}
      />
      <View
        style={{
          backgroundColor: background,
          borderRadius: radius,
          borderWidth,
          borderColor: Colors.ink,
          overflow: 'hidden',
        }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute' },
});
