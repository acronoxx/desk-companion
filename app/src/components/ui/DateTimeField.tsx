import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

type DateTimeFieldProps = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  /** Earliest date that can be picked. */
  minimumDate?: Date;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/**
 * A labelled date + time picker.
 * iOS: the native compact picker, inline. Android: two buttons that open the system dialogs
 * (Android has no combined date-time dialog).
 */
export default function DateTimeField({ label, value, onChange, minimumDate }: DateTimeFieldProps) {
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

      {Platform.OS === 'ios' ? (
        <View style={styles.iosBox}>
          <DateTimePicker
            value={value}
            mode="datetime"
            display="compact"
            minimumDate={minimumDate}
            accentColor={Colors.teal}
            onValueChange={(_event, picked) => onChange(picked)}
          />
        </View>
      ) : (
        <View style={styles.row}>
          <FieldButton
            icon="calendar"
            text={formatDate(value)}
            onPress={() => openAndroid('date')}
          />
          <FieldButton icon="clock" text={formatTime(value)} onPress={() => openAndroid('time')} />
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

  // ----- Android -----
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
