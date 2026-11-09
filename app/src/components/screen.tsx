import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type ScreenProps = {
  eyebrow?: string;
  title: string;
  children: ReactNode;
};

/** Page shell: paper background, centered eyebrow + title, scrollable content. */
export default function Screen({ eyebrow, title, children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 40, gap: 22 },
  header: { alignItems: 'center', marginTop: 8 },
  eyebrow: {
    color: Colors.teal,
    textTransform: 'uppercase',
    fontFamily: Fonts.bodyBlack,
    letterSpacing: 1.3,
    fontSize: 10,
    marginBottom: 6,
  },
  title: { color: Colors.ink, fontSize: 38, fontFamily: Fonts.title, textAlign: 'center' },
});
