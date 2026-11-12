import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import MonthCalendar from '@/components/MonthCalendar';
import ReminderRow from '@/components/ReminderRow';
import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextLink from '@/components/ui/TextLink';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useReminders } from '@/hooks/useReminders';

export default function CalendarScreen() {
  const { reminders, complete } = useReminders();
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

        {ofSelectedDay.length === 0 ? (
          <Text style={styles.empty}>Nothing planned. The day is yours.</Text>
        ) : (
          ofSelectedDay.map((reminder, index) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              onComplete={complete}
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
