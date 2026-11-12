import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import ReminderForm, { type ReminderFormValues } from '@/components/ReminderForm';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import TopBar from '@/components/ui/TopBar';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useActionError } from '@/hooks/useActionError';
import { useDevices } from '@/hooks/useDevices';
import { useReminders } from '@/hooks/useReminders';
import { getReminderDeviceIds } from '@/services/reminders';

export default function EditReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reminders, isLoading, update, complete, remove } = useReminders();
  const { devices } = useDevices();
  const { actionError, run } = useActionError();
  /** The devices the reminder is shown on now. null while loading. */
  const [deviceIds, setDeviceIds] = useState<string[] | null>(null);
  const [linksError, setLinksError] = useState<string | null>(null);

  const reminder = reminders.find((item) => item.id === id);
  const isDone = reminder?.completed_at != null;

  // The form takes its initial values once, so it is only shown when the links are loaded.
  useEffect(() => {
    let isCancelled = false;
    getReminderDeviceIds(id)
      .then((ids) => {
        if (!isCancelled) setDeviceIds(ids);
      })
      .catch(() => {
        if (!isCancelled) setLinksError('Could not load the devices of this reminder.');
      });
    return () => {
      isCancelled = true;
    };
  }, [id]);

  const handleSubmit = async ({ input, deviceIds: newDeviceIds }: ReminderFormValues) => {
    const isSaved = await run(
      () => update(id, input, newDeviceIds),
      'Could not save the changes. Check your connection and try again.',
    );
    if (isSaved) router.back();
    return isSaved;
  };

  const handleComplete = async () => {
    const isDoneNow = await run(() => complete(id), 'Could not mark the reminder as done.');
    if (isDoneNow) router.back();
  };

  const confirmDelete = () => {
    Alert.alert('Delete this reminder?', 'It will also disappear from your devices.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const isDeleted = await run(() => remove(id), 'Could not delete the reminder.');
          if (isDeleted) router.back();
        },
      },
    ]);
  };

  // ----- Loading / not found -----
  if (!reminder) {
    return (
      <Screen tabBar={false}>
        <TopBar title="Reminder" />
        {isLoading ? (
          <ActivityIndicator color={Colors.teal} style={styles.loader} />
        ) : (
          <Card>
            <Text style={styles.emptyTitle}>This reminder doesn’t exist anymore.</Text>
            <Text style={styles.emptyText}>It may have been deleted on another phone.</Text>
          </Card>
        )}
      </Screen>
    );
  }

  return (
    <Screen tabBar={false}>
      <TopBar
        title="Edit reminder"
        right={
          <Pressable
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete the reminder"
            hitSlop={8}
            style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}>
            <Feather name="trash-2" size={18} color={Colors.coral} />
          </Pressable>
        }
      />

      {actionError && <Notice tone="error" message={actionError} />}
      {linksError && <Notice tone="error" message={linksError} />}

      {!isDone && (
        <Button
          label={reminder.recurrence ? 'Done, move to the next one' : 'Mark as done'}
          icon="check-circle"
          variant="secondary"
          onPress={handleComplete}
        />
      )}

      {deviceIds === null ? (
        !linksError && <ActivityIndicator color={Colors.teal} style={styles.loader} />
      ) : (
        <ReminderForm
          initial={reminder}
          initialDeviceIds={deviceIds}
          devices={devices}
          submitLabel="Save the changes"
          onSubmit={handleSubmit}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 40,
  },
  delete: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: Colors.coral,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  emptyTitle: {
    fontFamily: Fonts.title,
    fontSize: 22,
    color: Colors.ink,
  },
  emptyText: {
    marginTop: 4,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
  },
});
