import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import type { Recurrence, Reminder } from '@/types/models';

type ReminderRowProps = {
  reminder: Reminder;
  /** Called when the circle is pressed. Not called for a reminder already done. */
  onComplete: (reminderId: string) => void;
  /** Shows the day next to the time (for lists that mix several days). */
  showDate?: boolean;
  /** Hides the bottom separator (for the last row of a list). */
  isLast?: boolean;
};

const RECURRENCE_LABELS: Record<Recurrence, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** One reminder in a list: a check circle, the title and the due time. */
export default function ReminderRow({ reminder, onComplete, showDate = false, isLast = false }: ReminderRowProps) {
  const isDone = reminder.completed_at !== null;
  const isOverdue = !isDone && new Date(reminder.due_at) < new Date();

  return (
    <View style={[styles.row, !isLast && styles.separator, isDone && styles.rowDone]}>
      <Pressable
        onPress={() => onComplete(reminder.id)}
        disabled={isDone}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityLabel={`Mark "${reminder.title}" as done`}
        accessibilityState={{ checked: isDone, disabled: isDone }}
      >
        {({ pressed }) => (
          <Feather
            name={isDone || pressed ? 'check-circle' : 'circle'}
            size={24}
            color={Colors.teal}
          />
        )}
      </Pressable>

      <View style={styles.texts}>
        <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={2}>
          {reminder.title}
        </Text>

        {(reminder.recurrence || reminder.details) && (
          <View style={styles.meta}>
            {reminder.recurrence && (
              <View style={styles.metaItem}>
                <Feather name="repeat" size={11} color={Colors.teal} />
                <Text style={styles.recurrence}>{RECURRENCE_LABELS[reminder.recurrence]}</Text>
              </View>
            )}
            {reminder.details && (
              <Text style={styles.details} numberOfLines={1}>
                {reminder.details}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.when}>
        <Text style={[styles.time, isOverdue && styles.overdue]}>{formatTime(reminder.due_at)}</Text>
        {isOverdue ? (
          <Text style={[styles.day, styles.overdue]}>Overdue</Text>
        ) : (
          showDate && <Text style={styles.day}>{formatDay(reminder.due_at)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ----- Row -----
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  rowDone: {
    opacity: 0.55,
  },

  // ----- Title and meta -----
  texts: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurrence: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 11,
    color: Colors.teal,
  },
  details: {
    flexShrink: 1,
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // ----- Time -----
  when: {
    alignItems: 'flex-end',
    gap: 2,
  },
  time: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textMuted,
  },
  day: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  overdue: {
    color: Colors.coral,
    fontFamily: Fonts.bodyBlack,
  },
});
