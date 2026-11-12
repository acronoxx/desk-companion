import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import MonthCalendar from '@/components/MonthCalendar';
import ReminderRow from '@/components/ReminderRow';
import Card from '@/components/ui/Card';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextLink from '@/components/ui/TextLink';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useActionError } from '@/hooks/useActionError';
import { useReminders } from '@/hooks/useReminders';

export default function CalendarScreen() {
  const { reminders, error, complete } = useReminders();
  const { actionError, run } = useActionError();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());

  // Only reminders still to do get a dot.
  const markedDays = new Set(
    reminders
      .filter((reminder) => reminder.completed_at === null)
      .map((reminder) => new Date(reminder.due_at).toDateString()),
  );
  const ofSelectedDay = reminders.filter(
    (reminder) => new Date(reminder.due_at).toDateString() === selected.toDateString(),
  );

  const isViewingToday =
    selected.toDateString() === new Date().toDateString() &&
    month.getMonth() === new Date().getMonth() &&
    month.getFullYear() === new Date().getFullYear();

  const changeMonth = (delta: -1 | 1) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const handleComplete = (reminderId: string) =>
    run(() => complete(reminderId), 'Could not mark the reminder as done.');

  const goToToday = () => {
    setMonth(new Date());
    setSelected(new Date());
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow="This month"
        title="Calendar"
        right={isViewingToday ? null : <TextLink label="Today" onPress={goToToday} />}
      />

      {error && <Notice tone="error" message={error} />}

      <Card>
        <MonthCalendar
          month={month}
          selected={selected}
          onSelect={setSelected}
          onChangeMonth={changeMonth}
          markedDays={markedDays}
        />
      </Card>

      <Card>
        <Text style={styles.dayEyebrow}>
          {selected.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={styles.dayTitle}>
          {ofSelectedDay.length === 0
            ? 'Free day'
            : `${ofSelectedDay.length} reminder${ofSelectedDay.length > 1 ? 's' : ''}`}
        </Text>

        {actionError && <Notice tone="error" message={actionError} />}

        {ofSelectedDay.length === 0 ? (
          <Text style={styles.empty}>Nothing planned. The day is yours.</Text>
        ) : (
          ofSelectedDay.map((reminder, index) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              onComplete={handleComplete}
              onPress={(reminderId) =>
                router.push({ pathname: '/reminders/[id]', params: { id: reminderId } })
              }
              isLast={index === ofSelectedDay.length - 1}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dayEyebrow: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: Colors.teal,
  },
  dayTitle: {
    fontFamily: Fonts.title,
    fontSize: 24,
    color: Colors.ink,
    marginTop: 2,
    marginBottom: 4,
  },
  empty: {
    marginTop: 6,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
