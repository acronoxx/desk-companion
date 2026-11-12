import { router } from 'expo-router';
import ReminderForm, { type ReminderFormValues } from '@/components/ReminderForm';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import TopBar from '@/components/ui/TopBar';
import { useActionError } from '@/hooks/useActionError';
import { useDevices } from '@/hooks/useDevices';
import { useReminders } from '@/hooks/useReminders';

export default function NewReminderScreen() {
  const { create } = useReminders();
  const { devices } = useDevices();
  const { actionError, run } = useActionError();

  const handleSubmit = async ({ input, deviceIds }: ReminderFormValues) => {
    const isSaved = await run(
      () => create(input, deviceIds),
      'Could not create the reminder. Check your connection and try again.',
    );
    if (isSaved) router.back();
    return isSaved;
  };

  return (
    <Screen tabBar={false}>
      <TopBar title="New reminder" />
      {actionError && <Notice tone="error" message={actionError} />}
      <ReminderForm
        devices={devices}
        // A new reminder alerts on every device by default.
        initialDeviceIds={devices.map((device) => device.id)}
        submitLabel="Create the reminder"
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
