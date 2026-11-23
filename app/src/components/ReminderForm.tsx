import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import DateTimeField from '@/components/ui/DateTimeField';
import TextField from '@/components/ui/TextField';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useLanguage } from '@/hooks/useLanguage';
import type { Strings } from '@/i18n/en';
import {
  isoWeekday,
  nextMatchingDay,
  normalizeDays,
  recurrenceLabel,
  WEEKDAYS,
} from '@/lib/recurrence';
import type { Device, Recurrence, Reminder, ReminderInput } from '@/types/models';

export type ReminderFormValues = {
  input: ReminderInput;
  /** The devices that alert (empty = only visible in the app). */
  deviceIds: string[];
};

type ReminderFormProps = {
  /** The reminder to edit. Leave it out to create a new one. */
  initial?: Reminder;
  /** The devices the reminder is shown on now (edit mode). */
  initialDeviceIds?: string[];
  /** The user's devices, to choose which ones alert. */
  devices: Device[];
  submitLabel: string;
  /** Saves the values. Resolves to false if it failed (the screen shows the error). */
  onSubmit: (values: ReminderFormValues) => Promise<boolean>;
};

/** Title limit of the reminders table (1 to 50 characters). */
const MAX_TITLE_LENGTH = 50;

/** How long before the deadline the device alerts, in minutes. */
const ALERT_OFFSETS = [0, 5, 15, 30, 60, 24 * 60];

/** The repeat choices, in order. null = once. Labels come from t.recurrence. */
const RECURRENCES: (Recurrence | null)[] = [null, 'daily', 'weekly', 'monthly', 'yearly'];

function offsetLabel(minutes: number, t: Strings['form']): string {
  if (minutes === 0) return t.atDueTime;
  if (minutes % (24 * 60) === 0) return t.daysBefore(minutes / (24 * 60));
  if (minutes % 60 === 0) return t.hoursBefore(minutes / 60);
  return t.minutesBefore(minutes);
}

/**
 * The repeat rule to save. A weekly reminder keeps its chosen days, and its deadline moves to the
 * first chosen day (Wednesday with "Thu, Fri" → Thursday, same time). All 7 days = every day.
 */
function repeatRule(
  recurrence: Recurrence | null,
  days: number[],
  dueAt: Date,
): { recurrence: Recurrence | null; recurrence_days: number[] | null; dueAt: Date } {
  if (recurrence !== 'weekly') return { recurrence, recurrence_days: null, dueAt };
  const sorted = normalizeDays(days);
  if (sorted.length === WEEKDAYS.length)
    return { recurrence: 'daily', recurrence_days: null, dueAt };
  return { recurrence, recurrence_days: sorted, dueAt: nextMatchingDay(dueAt, sorted) };
}

/** The next full hour, e.g. 14:23 → 15:00. Default deadline of a new reminder. */
function nextFullHour(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
}

/** The form to create or edit a reminder, shared by reminders/new.tsx and reminders/[id].tsx. */
export default function ReminderForm({
  initial,
  initialDeviceIds = [],
  devices,
  submitLabel,
  onSubmit,
}: ReminderFormProps) {
  const { t, locale } = useLanguage();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [details, setDetails] = useState(initial?.details ?? '');
  const [dueAt, setDueAt] = useState(() => (initial ? new Date(initial.due_at) : nextFullHour()));
  const [alertOffset, setAlertOffset] = useState(() =>
    initial
      ? Math.round(
          (new Date(initial.due_at).getTime() - new Date(initial.remind_at).getTime()) / 60_000,
        )
      : 0,
  );
  const [recurrence, setRecurrence] = useState<Recurrence | null>(initial?.recurrence ?? null);
  /** The days a weekly reminder repeats on. Starts on the day of the deadline. */
  const [weekDays, setWeekDays] = useState<number[]>(
    () => initial?.recurrence_days ?? [isoWeekday(dueAt)],
  );
  const [deviceIds, setDeviceIds] = useState<string[]>(initialDeviceIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  // An edited reminder can have an offset that is not in the list: show it too.
  const offsets = ALERT_OFFSETS.includes(alertOffset)
    ? ALERT_OFFSETS
    : [...ALERT_OFFSETS, alertOffset].sort((a, b) => a - b);

  // ----- Validation -----
  const titleError = title.trim() === '' ? t.form.titleRequired : null;
  // Only a new reminder must be in the future: an overdue one can still be edited.
  const dueError = !initial && dueAt <= new Date() ? t.form.futureRequired : null;
  const isValid = titleError === null && dueError === null;

  const rule = repeatRule(recurrence, weekDays, dueAt);
  const isMoved = rule.dueAt.getTime() !== dueAt.getTime();

  /** Turns a day on or off. The last selected day can't be turned off. */
  const toggleWeekDay = (iso: number) => {
    setWeekDays((current) => {
      if (!current.includes(iso)) return [...current, iso];
      return current.length > 1 ? current.filter((day) => day !== iso) : current;
    });
  };

  const toggleDevice = (deviceId: string) => {
    setDeviceIds((current) =>
      current.includes(deviceId) ? current.filter((id) => id !== deviceId) : [...current, deviceId],
    );
  };

  const handleSubmit = async () => {
    setHasTriedSubmit(true);
    if (!isValid) return;

    setIsSubmitting(true);
    const remindAt = new Date(rule.dueAt.getTime() - alertOffset * 60_000);
    await onSubmit({
      input: {
        title: title.trim(),
        details: details.trim() === '' ? null : details.trim(),
        due_at: rule.dueAt.toISOString(),
        remind_at: remindAt.toISOString(),
        recurrence: rule.recurrence,
        recurrence_days: rule.recurrence_days,
      },
      deviceIds,
    });
    // On success the screen goes back; on failure the form stays filled so the user can retry.
    setIsSubmitting(false);
  };

  return (
    <View style={styles.form}>
      {/* ----- What ----- */}
      <Card style={styles.section}>
        <TextField
          label={t.form.title(title.length, MAX_TITLE_LENGTH)}
          value={title}
          onChangeText={setTitle}
          placeholder={t.form.titlePlaceholder}
          maxLength={MAX_TITLE_LENGTH}
          returnKeyType="next"
          error={hasTriedSubmit ? titleError : null}
        />
        <TextField
          label={t.form.details}
          value={details}
          onChangeText={setDetails}
          placeholder={t.form.detailsPlaceholder}
          multiline
        />
      </Card>

      {/* ----- When ----- */}
      <Card style={styles.section}>
        <DateTimeField
          label={t.form.due}
          value={dueAt}
          onChange={setDueAt}
          minimumDate={initial ? undefined : new Date()}
        />
        {hasTriedSubmit && dueError && <Text style={styles.error}>{dueError}</Text>}

        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t.form.alert}</Text>
          <View style={styles.chips}>
            {offsets.map((minutes) => (
              <Chip
                key={minutes}
                label={offsetLabel(minutes, t.form)}
                selected={alertOffset === minutes}
                onPress={() => setAlertOffset(minutes)}
              />
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t.form.repeat}</Text>
          <View style={styles.chips}>
            {RECURRENCES.map((option) => (
              <Chip
                key={option ?? 'once'}
                label={option ? t.recurrence[option] : t.recurrence.once}
                icon={option ? 'repeat' : undefined}
                selected={recurrence === option}
                onPress={() => setRecurrence(option)}
              />
            ))}
          </View>

          {recurrence === 'weekly' && (
            <>
              <View style={styles.days}>
                {WEEKDAYS.map((iso) => {
                  const isOn = weekDays.includes(iso);
                  return (
                    <Pressable
                      key={iso}
                      onPress={() => toggleWeekDay(iso)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={t.recurrence.dayShort[iso - 1]}
                      accessibilityState={{ checked: isOn }}
                      style={({ pressed }) => [
                        styles.day,
                        isOn && styles.dayOn,
                        pressed && !isOn && styles.dayPressed,
                      ]}>
                      <Text style={[styles.dayLabel, isOn && styles.dayLabelOn]}>
                        {t.recurrence.dayLetter[iso - 1]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.hint}>
                {recurrenceLabel(t.recurrence, rule.recurrence, rule.recurrence_days)}
                {isMoved &&
                  t.form.starts(
                    rule.dueAt.toLocaleDateString(locale, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    }),
                  )}
              </Text>
            </>
          )}
        </View>
      </Card>

      {/* ----- Where ----- */}
      <Card style={styles.section}>
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{t.form.devices}</Text>
          {devices.length === 0 ? (
            <Text style={styles.hint}>{t.form.noDevice}</Text>
          ) : (
            <>
              <View style={styles.chips}>
                {devices.map((device) => (
                  <Chip
                    key={device.id}
                    role="checkbox"
                    icon="box"
                    label={device.name}
                    selected={deviceIds.includes(device.id)}
                    onPress={() => toggleDevice(device.id)}
                  />
                ))}
              </View>
              {deviceIds.length === 0 && <Text style={styles.hint}>{t.form.noneSelected}</Text>}
            </>
          )}
        </View>
      </Card>

      <Button
        label={submitLabel}
        icon="check"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={hasTriedSubmit && !isValid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
  },
  section: {
    gap: 16,
  },

  // ----- Choice groups -----
  group: {
    gap: 10,
  },
  groupLabel: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 13,
    color: Colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // ----- Days of the week -----
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  day: {
    flex: 1,
    maxWidth: 44,
    aspectRatio: 1,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: {
    borderColor: Colors.ink,
    backgroundColor: Colors.green,
  },
  dayPressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  dayLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textMuted,
  },
  dayLabelOn: {
    fontFamily: Fonts.bodyBlack,
    color: Colors.ink,
  },

  // ----- Messages -----
  hint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  error: {
    marginTop: -8,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.coral,
  },
});
