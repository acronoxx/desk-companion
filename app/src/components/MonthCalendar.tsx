import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type MonthCalendarProps = {
  /** Any date in the month to show. */
  month: Date;
  /** The selected day, highlighted in yellow. */
  selected: Date;
  onSelect: (day: Date) => void;
  /** Called with -1 or +1 when the arrows are pressed. */
  onChangeMonth: (delta: -1 | 1) => void;
  /** Days that get a dot, as `Date.toDateString()` keys. */
  markedDays: Set<string>;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** The days of the month, preceded by nulls so the 1st lands under its weekday (Monday first). */
function monthCells(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // getDay() starts on Sunday
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();

  const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= dayCount; day++) {
    cells.push(new Date(year, monthIndex, day));
  }
  return cells;
}

/** A month grid: arrows to change month, a dot under the days that have reminders. */
export default function MonthCalendar({ month, selected, onSelect, onChangeMonth, markedDays }: MonthCalendarProps) {
  const todayKey = new Date().toDateString();
  const selectedKey = selected.toDateString();
  const title = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <View>
      {/* ----- Month switcher ----- */}
      <View style={styles.toolbar}>
        <ArrowButton icon="chevron-left" label="Previous month" onPress={() => onChangeMonth(-1)} />
        <Text style={styles.title}>{title}</Text>
        <ArrowButton icon="chevron-right" label="Next month" onPress={() => onChangeMonth(1)} />
      </View>

      {/* ----- Weekday names ----- */}
      <View style={styles.grid}>
        {WEEKDAYS.map((weekday) => (
          <Text key={weekday} style={[styles.cell, styles.weekday]}>
            {weekday}
          </Text>
        ))}
      </View>

      {/* ----- Days ----- */}
      <View style={styles.grid}>
        {monthCells(month).map((day, index) => {
          if (day === null) return <View key={`empty-${index}`} style={styles.cell} />;

          const key = day.toDateString();
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;

          return (
            <Pressable
              key={key}
              onPress={() => onSelect(day)}
              accessibilityRole="button"
              accessibilityLabel={day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              accessibilityState={{ selected: isSelected }}
              style={styles.cell}
            >
              <View style={[styles.day, isToday && styles.dayToday, isSelected && styles.daySelected]}>
                <Text style={[styles.dayText, isToday && !isSelected && styles.dayTextToday]}>
                  {day.getDate()}
                </Text>
              </View>
              <View style={[styles.dot, markedDays.has(key) && styles.dotVisible]} />
            </Pressable>
          );
        })}
      </View>
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
      style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
    >
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekday: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 11,
    letterSpacing: 0.5,
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
  dot: {
    width: 6,
    height: 6,
    marginTop: 3,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  dotVisible: {
    backgroundColor: Colors.coral,
  },
});
