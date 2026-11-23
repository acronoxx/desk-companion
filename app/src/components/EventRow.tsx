import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useLanguage } from '@/hooks/useLanguage';
import type { CalendarEvent } from '@/types/models';

type EventRowProps = {
  event: CalendarEvent;
  /** Hides the bottom separator (for the last row of a list). */
  isLast?: boolean;
};

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** One event of an outside calendar: read-only, a color bar instead of a check circle. */
export default function EventRow({ event, isLast = false }: EventRowProps) {
  const { t, locale } = useLanguage();
  return (
    <View style={[styles.row, !isLast && styles.separator]}>
      <View style={[styles.bar, { backgroundColor: event.color }]} />
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title || t.common.noTitle}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[event.calendarName, event.location].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View style={styles.when}>
        {event.allDay ? (
          <Text style={styles.time}>{t.common.allDay}</Text>
        ) : (
          <>
            <Text style={styles.time}>{formatTime(event.start, locale)}</Text>
            <Text style={styles.end}>{formatTime(event.end, locale)}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  bar: {
    width: 5,
    alignSelf: 'stretch',
    borderRadius: 3,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  when: {
    alignItems: 'flex-end',
    gap: 2,
  },
  time: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textMuted,
  },
  end: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textLight,
  },
});
