import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Screen from '@/components/screen';
import StickerCard from '@/components/sticker-card';
import { useUserId } from '@/hooks/use-user-id';
import { getReminders } from '@/services/reminders';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import type { Reminder } from '@/types/models';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export default function CalendarScreen() {
  const userId = useUserId();
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!userId) return;
    getReminders(userId)
      .then(setReminders)
      .catch(() => setReminders([]));
  }, [userId]);

  // Grid starts on Monday; leading nulls pad the first week.
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const days: (Date | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= count; d++) days.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [month]);

  const hasReminder = (day: Date) => reminders.some((r) => sameDay(new Date(r.due_at), day));
  const dayReminders = reminders.filter((r) => sameDay(new Date(r.due_at), selected));
  const title = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <Screen eyebrow="Ce mois-ci" title="Calendrier">
      <StickerCard>
        <View style={styles.pad}>
          <View style={styles.toolbar}>
            <Pressable style={styles.arrow} onPress={() => shift(-1)} accessibilityLabel="Mois précédent">
              <Text style={styles.arrowText}>‹</Text>
            </Pressable>
            <Text style={styles.month}>{title}</Text>
            <Pressable style={styles.arrow} onPress={() => shift(1)} accessibilityLabel="Mois suivant">
              <Text style={styles.arrowText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.week}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={i} style={styles.cell} />;
              const isToday = sameDay(day, today);
              const isSelected = sameDay(day, selected);
              return (
                <Pressable key={i} style={styles.cell} onPress={() => setSelected(day)}>
                  <View
                    style={[
                      styles.dayBubble,
                      isToday && styles.today,
                      isSelected && styles.selected,
                    ]}>
                    <Text style={[styles.dayText, isToday && styles.todayText]}>{day.getDate()}</Text>
                  </View>
                  {hasReminder(day) && <View style={styles.dot} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </StickerCard>

      <StickerCard>
        <View style={styles.pad}>
          <Text style={styles.small}>
            {selected.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <Text style={styles.agendaTitle}>Ta journée</Text>
          {dayReminders.length === 0 ? (
            <Text style={styles.free}>Rien de prévu. Le reste est à toi.</Text>
          ) : (
            dayReminders.map((r) => (
              <View key={r.id} style={styles.event}>
                <Text style={styles.small}>
                  {new Date(r.due_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.eventTitle}>{r.title}</Text>
              </View>
            ))
          )}
        </View>
      </StickerCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 18 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  arrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: Colors.ink, fontSize: 22, lineHeight: 24, fontFamily: Fonts.title },
  month: { color: Colors.ink, fontSize: 21, fontFamily: Fonts.title, textTransform: 'capitalize' },
  week: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textMuted,
    fontFamily: Fonts.body, fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingVertical: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' },
  dayBubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: Colors.teal },
  selected: { borderWidth: 2, borderColor: Colors.ink },
  dayText: { color: Colors.ink, fontFamily: Fonts.body, fontSize: 13 },
  todayText: { color: Colors.white, fontFamily: Fonts.bodyBlack },
  dot: { position: 'absolute', bottom: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.coral },
  small: { color: Colors.textMuted, fontFamily: Fonts.body, fontSize: 11, textTransform: 'capitalize' },
  agendaTitle: { color: Colors.ink, fontSize: 24, fontFamily: Fonts.title, marginVertical: 6, marginBottom: 14 },
  free: { color: Colors.textMuted, fontFamily: Fonts.body, fontSize: 14 },
  event: {
    borderTopWidth: 2,
    borderTopColor: Colors.coral,
    paddingVertical: 12,
    gap: 4,
  },
  eventTitle: { color: Colors.ink, fontSize: 15, fontFamily: Fonts.bodyBold },
});
