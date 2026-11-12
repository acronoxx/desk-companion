import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type TopBarProps = {
  title: string;
  /** Element on the right (e.g. a delete button). */
  right?: ReactNode;
};

/** Header of a screen opened on top of the tabs: a back button and a title. */
export default function TopBar({ title, right }: TopBarProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
        <Feather name="arrow-left" size={20} color={Colors.ink} />
      </Pressable>
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const BUTTON_SIZE = 42;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: Colors.yellow,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.title,
    fontSize: 26,
    color: Colors.ink,
  },
  // Same width as the back button, so the title stays balanced when there is nothing on the right.
  right: {
    minWidth: BUTTON_SIZE,
    alignItems: 'flex-end',
  },
});
