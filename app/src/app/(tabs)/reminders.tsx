import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import QuickAddReminder from '@/components/QuickAddReminder';
import ReminderRow from '@/components/ReminderRow';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useActionError } from '@/hooks/useActionError';
import { useReminders } from '@/hooks/useReminders';
import type { Reminder } from '@/types/models';

type Filter = 'todo' | 'done' | 'all';

const FILTERS = [
  { value: 'todo', label: 'To do' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
] as const;

/** A reminder added from the quick field is due in one hour, and the device alerts at that time. */
const QUICK_ADD_DELAY_MS = 60 * 60_000;

type DayGroup = { key: string; label: string; reminders: Reminder[] };

/** Label of a day section: "Overdue", "Today", "Tomorrow" or the date. */
function dayLabel(date: Date, isOverdue: boolean): string {
  if (isOverdue) return 'Overdue';
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Splits reminders (already sorted by due date) into one group per day. Late ones go first, together. */
function groupByDay(reminders: Reminder[]): DayGroup[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const groups: DayGroup[] = [];

  for (const reminder of reminders) {
    const due = new Date(reminder.due_at);
    const isOverdue = reminder.completed_at === null && due < startOfToday;
    const key = isOverdue ? 'overdue' : due.toDateString();
    const last = groups[groups.length - 1];

    if (last?.key === key) {
      last.reminders.push(reminder);
    } else {
      groups.push({ key, label: dayLabel(due, isOverdue), reminders: [reminder] });
    }
  }
  return groups;
}

export default function RemindersScreen() {
  const { reminders, error, complete, create } = useReminders();
  const { actionError, run } = useActionError();
  const [filter, setFilter] = useState<Filter>('todo');

  const todoCount = reminders.filter((reminder) => reminder.completed_at === null).length;
  const shown = reminders.filter((reminder) => {
    if (filter === 'todo') return reminder.completed_at === null;
    if (filter === 'done') return reminder.completed_at !== null;
    return true;
  });
  const groups = groupByDay(shown);

  const handleQuickAdd = (title: string) => {
    const dueAt = new Date(Date.now() + QUICK_ADD_DELAY_MS).toISOString();
    return run(
      () => create({ title, due_at: dueAt, remind_at: dueAt }),
      'Could not add the reminder.',
    );
  };

  const handleComplete = (reminderId: string) =>
    run(() => complete(reminderId), 'Could not mark the reminder as done.');

  const openReminder = (reminderId: string) =>
    router.push({ pathname: '/reminders/[id]', params: { id: reminderId } });

  return (
    <Screen>
      <ScreenHeader
        eyebrow="To do"
        title="Reminders"
        right={
          <View style={styles.headerRight}>
            <Badge label={`${todoCount} to do`} />
            <Pressable
              onPress={() => router.push('/reminders/new')}
              accessibilityRole="button"
              accessibilityLabel="New reminder"
              style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}>
              <Feather name="plus" size={22} color={Colors.ink} />
            </Pressable>
          </View>
        }
      />

      <QuickAddReminder onAdd={handleQuickAdd} />
      <Text style={styles.hint}>Quick reminders are due in one hour. Tap one to edit it.</Text>

      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />

      {error && <Notice tone="error" message={error} />}
      {actionError && <Notice tone="error" message={actionError} />}

      {groups.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>
            {filter === 'done' ? 'Nothing done yet.' : 'All clear.'}
          </Text>
          <Text style={styles.emptyText}>
            {filter === 'done' ? 'Finished reminders will show up here.' : 'Enjoy the free time.'}
          </Text>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.key} style={styles.group}>
            <View
              style={[styles.groupHeader, group.key === 'overdue' && styles.groupHeaderOverdue]}>
              <Text
                style={[styles.groupLabel, group.key === 'overdue' && styles.groupLabelOverdue]}>
                {group.label}
              </Text>
              <Text style={styles.groupCount}>{group.reminders.length}</Text>
            </View>
            <View style={styles.groupBody}>
              {group.reminders.map((reminder, index) => (
                <ReminderRow
                  key={reminder.id}
                  reminder={reminder}
                  onComplete={handleComplete}
                  onPress={openReminder}
                  showDate={group.key === 'overdue'}
                  isLast={index === group.reminders.length - 1}
                />
              ))}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // ----- Header -----
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `3px 3px 0 ${Colors.ink}`,
  },
  newButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    boxShadow: `1px 1px 0 ${Colors.ink}`,
  },

  hint: {
    marginTop: -10,
    marginLeft: 4,
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // ----- Day group -----
  group: {
    padding: 0,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  groupHeaderOverdue: {
    backgroundColor: Colors.white,
  },
  groupLabel: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  groupLabelOverdue: {
    color: Colors.coral,
  },
  groupCount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.textMuted,
  },
  groupBody: {
    paddingHorizontal: 18,
  },

  // ----- Empty state -----
  emptyTitle: {
    fontFamily: Fonts.title,
    fontSize: 22,
    color: Colors.ink,
  },
  emptyText: {
    marginTop: 4,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
