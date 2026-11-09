import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Button from '@/components/button';
import Screen from '@/components/screen';
import StickerCard from '@/components/sticker-card';
import { useUserId } from '@/hooks/use-user-id';
import { completeReminder, createReminder, getReminders } from '@/services/reminders';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import type { Reminder } from '@/types/models';

function formatDue(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

export default function RemindersScreen() {
  const userId = useUserId();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      setReminders(await getReminders(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible.');
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const title = draft.trim();
    if (!userId || !title) return;
    try {
      setError(null);
      const now = new Date();
      const due = new Date(now.getTime() + 60 * 60 * 1000);
      const created = await createReminder(userId, {
        title: title.slice(0, 50),
        details: null,
        due_at: due.toISOString(),
        remind_at: now.toISOString(),
        recurrence: null,
      });
      setReminders((current) =>
        [...current, created].sort((a, b) => a.due_at.localeCompare(b.due_at)),
      );
      setDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ajout impossible.');
    }
  };

  const complete = async (reminder: Reminder) => {
    if (!userId) return;
    try {
      await completeReminder(userId, reminder.id);
      setReminders((current) => current.filter((item) => item.id !== reminder.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action impossible.');
    }
  };

  return (
    <Screen eyebrow="À faire" title="Rappels">
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{reminders.length} à faire</Text>
      </View>

      <StickerCard radius={18} offset={4}>
        <View style={styles.quickAdd}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Ajouter un rappel…"
            placeholderTextColor={Colors.textMuted}
            maxLength={50}
            returnKeyType="done"
            onSubmitEditing={add}
          />
          <Button label="Ajouter" onPress={add} disabled={!draft.trim()} />
        </View>
      </StickerCard>

      {error && <Text style={styles.error}>{error}</Text>}

      <StickerCard>
        {reminders.length === 0 ? (
          <Text style={styles.empty}>Rien ici pour le moment. Profite de l’espace.</Text>
        ) : (
          reminders.map((item, index) => (
            <Pressable
              key={item.id}
              style={[styles.row, index > 0 && styles.rowBorder]}
              onPress={() => complete(item)}
              accessibilityRole="button"
              accessibilityLabel={`Terminer ${item.title}`}>
              <View style={styles.circle} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.small}>
                  {formatDue(item.due_at)}
                  {item.recurrence ? ' · récurrent' : ''}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </StickerCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badgeRow: { alignItems: 'center' },
  badge: {
    backgroundColor: Colors.yellow,
    color: Colors.ink,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 11,
    fontFamily: Fonts.bodyBlack,
    overflow: 'hidden',
  },
  quickAdd: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingLeft: 14 },
  input: { flex: 1, color: Colors.ink, fontFamily: Fonts.body, fontSize: 15, paddingVertical: 8 },
  error: { color: Colors.coral, fontFamily: Fonts.bodyBold, textAlign: 'center' },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 36 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 16, paddingHorizontal: 20 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.line },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { color: Colors.ink, fontSize: 15, fontFamily: Fonts.bodyBold },
  small: { color: Colors.textMuted, fontFamily: Fonts.body, fontSize: 11 },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.teal },
});
