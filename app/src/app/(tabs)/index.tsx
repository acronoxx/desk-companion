import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/button';
import StickerCard from '@/components/sticker-card';
import { getSession } from '@/services/auth';
import { getProfile } from '@/services/profile';
import { completeReminder, getReminders } from '@/services/reminders';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import type { Reminder } from '@/types/models';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatToday() {
  const text = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function HomeScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const session = await getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUserId(session.user.id);
      const [profile, list] = await Promise.all([
        getProfile(session.user.id).catch(() => null),
        getReminders(session.user.id),
      ]);
      setName(profile?.display_name ?? '');
      setReminders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const complete = async (reminder: Reminder) => {
    if (!userId) return;
    try {
      await completeReminder(userId, reminder.id);
      setReminders((current) => current.filter((item) => item.id !== reminder.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action impossible.');
    }
  };

  const focus = reminders[0];
  const others = reminders.slice(1, 4);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.teal} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>{formatToday()}</Text>
          <Text style={styles.title}>{name ? `Salut ${name},` : 'Salut,'}</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <StickerCard background={Colors.yellow} shadow={Colors.green} radius={26} offset={8} borderWidth={3}>
          <View style={styles.focusPad}>
            <Text style={styles.eyebrow}>✦ Le truc à faire</Text>
            {focus ? (
              <>
                <Text style={styles.focusTitle}>{focus.title}</Text>
                <Text style={styles.focusMeta}>Prévu à {formatTime(focus.due_at)}</Text>
                <View style={styles.focusAction}>
                  <Button label="C’est fait" variant="secondary" onPress={() => complete(focus)} />
                </View>
              </>
            ) : (
              <Text style={styles.focusTitle}>Rien de prévu. Profite de l’espace.</Text>
            )}
          </View>
        </StickerCard>

        <StickerCard offset={8}>
          <View style={styles.panelPad}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.small}>À garder sous le coude</Text>
                <Text style={styles.panelTitle}>Tes rappels</Text>
              </View>
              <Button label="Tout voir" variant="link" onPress={() => router.push('/reminders')} />
            </View>

            {others.length === 0 && <Text style={styles.small}>Rien d’autre pour le moment.</Text>}
            {others.map((item) => (
              <Pressable key={item.id} style={styles.row} onPress={() => complete(item)}>
                <View style={styles.circle} />
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.small}>{formatTime(item.due_at)}</Text>
              </Pressable>
            ))}

            <Text style={[styles.small, styles.note]}>
              Encore {reminders.length} petite{reminders.length > 1 ? 's' : ''} chose
              {reminders.length > 1 ? 's' : ''} pour aujourd’hui
            </Text>
          </View>
        </StickerCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  welcome: { alignItems: 'center', marginTop: 8 },
  eyebrow: {
    color: Colors.teal,
    textTransform: 'uppercase',
    fontFamily: Fonts.bodyBlack,
    letterSpacing: 1.3,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 6,
  },
  title: { color: Colors.ink, fontSize: 38, fontFamily: Fonts.title, textAlign: 'center' },
  error: { color: Colors.coral, fontFamily: Fonts.bodyBold, textAlign: 'center' },


  focusPad: { padding: 24, alignItems: 'center' },
  focusTitle: {
    color: Colors.ink,
    fontSize: 26,
    fontFamily: Fonts.title,
    textAlign: 'center',
    marginVertical: 12,
  },
  focusMeta: { color: Colors.teal, fontFamily: Fonts.body, fontSize: 12 },
  focusAction: { marginTop: 18 },

  panelPad: { padding: 20 },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  panelTitle: { color: Colors.ink, fontSize: 24, fontFamily: Fonts.title },
  small: { color: Colors.textMuted, fontFamily: Fonts.body, fontSize: 11 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.teal,
  },
  rowTitle: { flex: 1, color: Colors.ink, fontFamily: Fonts.body, fontSize: 14 },
  note: { marginTop: 12 },
});
