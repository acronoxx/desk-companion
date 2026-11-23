import { createElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useLanguage } from '@/hooks/useLanguage';

type DateTimeFieldProps = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  /** Earliest date that can be picked. */
  minimumDate?: Date;
};

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local date as an HTML date input value, e.g. "2026-11-16". */
function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local time as an HTML time input value, e.g. "09:30". */
function toTimeInput(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Style of the web inputs: same look as the Android buttons. */
const WEB_INPUT_STYLE = {
  flex: 1,
  minHeight: 52,
  padding: '0 14px',
  border: `2px solid ${Colors.ink}`,
  borderRadius: 14,
  backgroundColor: Colors.white,
  fontFamily: Fonts.bodyBold,
  fontSize: 15,
  color: Colors.text,
  boxSizing: 'border-box',
} as const;

/**
 * A labelled date + time picker.
 * iOS: the native compact picker, inline. Android: two buttons that open the system dialogs
 * (Android has no combined date-time dialog). Web: the browser's date and time inputs
 * (the native picker module does nothing on web).
 */
export default function DateTimeField({ label, value, onChange, minimumDate }: DateTimeFieldProps) {
  const { locale } = useLanguage();
  /** Android only: opens the date or the time dialog, and keeps the other part of the value. */
  const openAndroid = (mode: 'date' | 'time') => {
    DateTimePickerAndroid.open({
      value,
      mode,
      is24Hour: true,
      minimumDate: mode === 'date' ? minimumDate : undefined,
      onValueChange: (_event, picked) => {
        const next = new Date(value);
        if (mode === 'date') {
          next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        } else {
          next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
        }
        onChange(next);
      },
    });
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      {Platform.OS === 'web' ? (
        <View style={styles.row}>
          {createElement('input', {
            type: 'date',
            value: toDateInput(value),
            min: minimumDate ? toDateInput(minimumDate) : undefined,
            'aria-label': `${label} date`,
            style: WEB_INPUT_STYLE,
            onChange: (event: { target: { value: string } }) => {
              const [year, month, day] = event.target.value.split('-').map(Number);
              if (!year) return; // field cleared
              const next = new Date(value);
              next.setFullYear(year, month - 1, day);
              onChange(next);
            },
          })}
          {createElement('input', {
            type: 'time',
            value: toTimeInput(value),
            'aria-label': `${label} time`,
            style: WEB_INPUT_STYLE,
            onChange: (event: { target: { value: string } }) => {
              const [hours, minutes] = event.target.value.split(':').map(Number);
              if (Number.isNaN(hours)) return; // field cleared
              const next = new Date(value);
              next.setHours(hours, minutes, 0, 0);
              onChange(next);
            },
          })}
        </View>
      ) : Platform.OS === 'ios' ? (
        <View style={styles.iosBox}>
          <DateTimePicker
            value={value}
            mode="datetime"
            display="compact"
            locale={locale}
            minimumDate={minimumDate}
            accentColor={Colors.teal}
            onValueChange={(_event, picked) => onChange(picked)}
          />
        </View>
      ) : (
        <View style={styles.row}>
          <FieldButton
            icon="calendar"
            text={formatDate(value, locale)}
            onPress={() => openAndroid('date')}
          />
          <FieldButton
            icon="clock"
            text={formatTime(value, locale)}
            onPress={() => openAndroid('time')}
          />
        </View>
      )}
    </View>
  );
}

type FieldButtonProps = {
  icon: 'calendar' | 'clock';
  text: string;
  onPress: () => void;
};

function FieldButton({ icon, text, onPress }: FieldButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <Feather name={icon} size={16} color={Colors.teal} />
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 13,
    color: Colors.text,
  },

  // ----- iOS -----
  iosBox: {
    alignItems: 'flex-start',
  },

  // ----- Android and web -----
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 14,
    backgroundColor: Colors.white,
  },
  buttonPressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  buttonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
});
