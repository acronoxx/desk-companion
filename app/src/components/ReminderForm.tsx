import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import DateTimeField from '@/components/ui/DateTimeField';
import TextField from '@/components/ui/TextField';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
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

const RECURRENCES: { value: Recurrence | null; label: string }[] = [
  { value: null, label: 'Once' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'yearly', label: 'Every year' },
];

function offsetLabel(minutes: number): string {
  if (minutes === 0) return 'At due time';
  if (minutes % (24 * 60) === 0) return `${minutes / (24 * 60)} day before`;
  if (minutes % 60 === 0) return `${minutes / 60} h before`;
  return `${minutes} min before`;
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
  const [deviceIds, setDeviceIds] = useState<string[]>(initialDeviceIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  // An edited reminder can have an offset that is not in the list: show it too.
  const offsets = ALERT_OFFSETS.includes(alertOffset)
    ? ALERT_OFFSETS
    : [...ALERT_OFFSETS, alertOffset].sort((a, b) => a - b);

  // ----- Validation -----
  const titleError = title.trim() === '' ? 'Give your reminder a title.' : null;
  // Only a new reminder must be in the future: an overdue one can still be edited.
  const dueError = !initial && dueAt <= new Date() ? 'Pick a time in the future.' : null;
  const isValid = titleError === null && dueError === null;

  const toggleDevice = (deviceId: string) => {
    setDeviceIds((current) =>
      current.includes(deviceId) ? current.filter((id) => id !== deviceId) : [...current, deviceId],
    );
  };

  const handleSubmit = async () => {
    setHasTriedSubmit(true);
    if (!isValid) return;

    setIsSubmitting(true);
    const remindAt = new Date(dueAt.getTime() - alertOffset * 60_000);
    await onSubmit({
      input: {
        title: title.trim(),
        details: details.trim() === '' ? null : details.trim(),
        due_at: dueAt.toISOString(),
        remind_at: remindAt.toISOString(),
        recurrence,
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
          label={`Title (${title.length}/${MAX_TITLE_LENGTH})`}
          value={title}
          onChangeText={setTitle}
          placeholder="Send the lab report"
          maxLength={MAX_TITLE_LENGTH}
          returnKeyType="next"
          error={hasTriedSubmit ? titleError : null}
        />
        <TextField
          label="Details (optional)"
          value={details}
          onChangeText={setDetails}
          placeholder="Room, link, what to bring…"
          multiline
        />
      </Card>

      {/* ----- When ----- */}
      <Card style={styles.section}>
        <DateTimeField
          label="Due"
          value={dueAt}
          onChange={setDueAt}
          minimumDate={initial ? undefined : new Date()}
        />
        {hasTriedSubmit && dueError && <Text style={styles.error}>{dueError}</Text>}

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Alert</Text>
          <View style={styles.chips}>
            {offsets.map((minutes) => (
              <Chip
                key={minutes}
                label={offsetLabel(minutes)}
                selected={alertOffset === minutes}
                onPress={() => setAlertOffset(minutes)}
              />
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Repeat</Text>
          <View style={styles.chips}>
            {RECURRENCES.map((option) => (
              <Chip
                key={option.label}
                label={option.label}
                icon={option.value ? 'repeat' : undefined}
                selected={recurrence === option.value}
                onPress={() => setRecurrence(option.value)}
              />
            ))}
          </View>
        </View>
      </Card>

      {/* ----- Where ----- */}
      <Card style={styles.section}>
        <View style={styles.group}>
          <Text style={styles.groupLabel}>Devices that alert</Text>
          {devices.length === 0 ? (
            <Text style={styles.hint}>
              No device paired yet: the reminder will only show in the app.
            </Text>
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
              {deviceIds.length === 0 && (
                <Text style={styles.hint}>None selected: the reminder only shows in the app.</Text>
              )}
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
