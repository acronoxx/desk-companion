import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import EventRow from '@/components/EventRow';
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
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useLanguage } from '@/hooks/useLanguage';
import { useReminders } from '@/hooks/useReminders';
import type { CalendarEvent } from '@/types/models';

/**
 * The days an event covers, as `Date.toDateString()` keys. A multi-day event marks every day;
 * its end is excluded (an all-day event ends at the next midnight).
 */
function eventDayKeys(event: CalendarEvent): string[] {
  const day = new Date(event.start);
  day.setHours(0, 0, 0, 0);
  const end = new Date(event.end);
  const keys = [day.toDateString()];
  for (
    day.setDate(day.getDate() + 1);
    day < end && keys.length < 62;
    day.setDate(day.getDate() + 1)
  ) {
    keys.push(day.toDateString());
  }
  return keys;
}

export default function CalendarScreen() {
  const { t, locale } = useLanguage();
  const { reminders, error, complete } = useReminders();
  const { actionError, run } = useActionError();
  const { events } = useCalendarEvents();
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
  const eventDays = new Set(events.flatMap(eventDayKeys));
  const eventsOfSelectedDay = events.filter((event) =>
    eventDayKeys(event).includes(selected.toDateString()),
  );

  const isViewingToday =
    selected.toDateString() === new Date().toDateString() &&
    month.getMonth() === new Date().getMonth() &&
    month.getFullYear() === new Date().getFullYear();

  const changeMonth = (delta: -1 | 1) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const handleComplete = (reminderId: string) =>
    run(() => complete(reminderId), t.reminders.completeError);

  const goToToday = () => {
    setMonth(new Date());
    setSelected(new Date());
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow={t.calendar.eyebrow}
        title={t.calendar.title}
        right={isViewingToday ? null : <TextLink label={t.common.today} onPress={goToToday} />}
      />

      {error && <Notice tone="error" message={error} />}

      <Card>
        <MonthCalendar
          month={month}
          selected={selected}
          onSelect={setSelected}
          onChangeMonth={changeMonth}
          markedDays={markedDays}
          eventDays={eventDays}
        />
      </Card>

      <Card>
        <Text style={styles.dayEyebrow}>
          {selected.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={styles.dayTitle}>
          {ofSelectedDay.length === 0 && eventsOfSelectedDay.length === 0
            ? t.calendar.freeDay
            : [
                ofSelectedDay.length > 0 && t.calendar.reminderCount(ofSelectedDay.length),
                eventsOfSelectedDay.length > 0 && t.calendar.eventCount(eventsOfSelectedDay.length),
              ]
                .filter(Boolean)
                .join(' · ')}
        </Text>

        {actionError && <Notice tone="error" message={actionError} />}

        {ofSelectedDay.length === 0 && eventsOfSelectedDay.length === 0 ? (
          <Text style={styles.empty}>{t.calendar.nothingPlanned}</Text>
        ) : (
          ofSelectedDay.map((reminder, index) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              onComplete={handleComplete}
              onPress={(reminderId) =>
                router.push({ pathname: '/reminders/[id]', params: { id: reminderId } })
              }
              isLast={index === ofSelectedDay.length - 1 && eventsOfSelectedDay.length === 0}
            />
          ))
        )}
        {eventsOfSelectedDay.map((event, index) => (
          <EventRow
            key={event.id}
            event={event}
            isLast={index === eventsOfSelectedDay.length - 1}
          />
        ))}
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
