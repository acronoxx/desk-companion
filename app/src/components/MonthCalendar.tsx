import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useLanguage } from '@/hooks/useLanguage';

type MonthCalendarProps = {
  /** Any date in the month to show. */
  month: Date;
  /** The selected day, highlighted in yellow. */
  selected: Date;
  onSelect: (day: Date) => void;
  /** Called with -1 or +1 when the arrows are pressed. */
  onChangeMonth: (delta: -1 | 1) => void;
  /** Days with reminders to do (coral dot), as `Date.toDateString()` keys. */
  markedDays: Set<string>;
  /** Days with events of outside calendars (teal dot), same keys. */
  eventDays?: Set<string>;
};

/**
 * The weeks of the month, Monday first: 7 cells each, null before the 1st and after the last day.
 * Rendered as real rows (not one wrapping list of 1/7 % cells, which rounding can push to 8 per
 * line on a phone).
 */
function monthWeeks(month: Date): (Date | null)[][] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // getDay() starts on Sunday
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();

  const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= dayCount; day++) {
    cells.push(new Date(year, monthIndex, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** A month grid: arrows to change month, dots under the days that have reminders or events. */
export default function MonthCalendar({
  month,
  selected,
  onSelect,
  onChangeMonth,
  markedDays,
  eventDays,
}: MonthCalendarProps) {
  const { t, locale } = useLanguage();
  const todayKey = new Date().toDateString();
  const selectedKey = selected.toDateString();
  const title = month.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  return (
    <View>
      {/* ----- Month switcher ----- */}
      <View style={styles.toolbar}>
        <ArrowButton
          icon="chevron-left"
          label={t.calendar.previousMonth}
          onPress={() => onChangeMonth(-1)}
        />
        <Text style={styles.title}>{title}</Text>
        <ArrowButton
          icon="chevron-right"
          label={t.calendar.nextMonth}
          onPress={() => onChangeMonth(1)}
        />
      </View>

      {/* ----- Weekday names ----- */}
      <View style={styles.week}>
        {t.recurrence.dayShort.map((weekday) => (
          <Text key={weekday} style={[styles.cell, styles.weekday]}>
            {weekday}
          </Text>
        ))}
      </View>

      {/* ----- Days, one row per week ----- */}
      {monthWeeks(month).map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((day, index) => {
            if (day === null) return <View key={`empty-${index}`} style={styles.cell} />;

            const key = day.toDateString();
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;

            return (
              <Pressable
                key={key}
                onPress={() => onSelect(day)}
                accessibilityRole="button"
                accessibilityLabel={day.toLocaleDateString(locale, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                accessibilityState={{ selected: isSelected }}
                style={styles.cell}>
                <View
                  style={[
                    styles.day,
                    isToday && styles.dayToday,
                    isSelected && styles.daySelected,
                  ]}>
                  <Text style={[styles.dayText, isToday && !isSelected && styles.dayTextToday]}>
                    {day.getDate()}
                  </Text>
                </View>
                {/* Fixed height, so days with and without dots line up. */}
                <View style={styles.dots}>
                  {markedDays.has(key) && <View style={[styles.dot, styles.dotVisible]} />}
                  {eventDays?.has(key) && <View style={[styles.dot, styles.dotEvent]} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

type ArrowButtonProps = {
  icon: 'chevron-left' | 'chevron-right';
  label: string;
  onPress: () => void;
};

function ArrowButton({ icon, label, onPress }: ArrowButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}>
      <Feather name={icon} size={20} color={Colors.ink} />
    </Pressable>
  );
}

const DAY_SIZE = 36;

const styles = StyleSheet.create({
  // ----- Month switcher -----
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 22,
    color: Colors.ink,
  },
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
  arrowPressed: {
    backgroundColor: Colors.yellow,
  },

  // ----- Grid -----
  week: {
    flexDirection: 'row',
  },
  cell: {
    // 7 equal shares of the row, whatever the screen width.
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekday: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 11,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: Colors.textMuted,
  },

  // ----- Day -----
  day: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderColor: Colors.teal,
  },
  daySelected: {
    backgroundColor: Colors.yellow,
    borderColor: Colors.ink,
  },
  dayText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
  },
  dayTextToday: {
    color: Colors.teal,
    fontFamily: Fonts.bodyBlack,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    marginTop: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  dotEvent: {
    backgroundColor: Colors.teal,
  },
  dotVisible: {
    backgroundColor: Colors.coral,
  },
});
