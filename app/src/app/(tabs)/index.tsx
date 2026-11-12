import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import ReminderRow from '@/components/ReminderRow';
import Card from '@/components/ui/Card';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextLink from '@/components/ui/TextLink';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useDevices } from '@/hooks/useDevices';
import { useProfile } from '@/hooks/useProfile';
import { useReminders } from '@/hooks/useReminders';
import { isDeviceOnline } from '@/services/devices';

const PREVIEW_COUNT = 3;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Hello';
  return 'Good evening';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export default function HomeScreen() {
  const { profile } = useProfile();
  const { reminders, error, complete } = useReminders();
  const { devices } = useDevices();

  const open = reminders.filter((reminder) => reminder.completed_at === null);
  const [next, ...upcoming] = open; // the list is sorted by due date
  const leftToday = open.filter((reminder) => isToday(reminder.due_at)).length;
  const onlineCount = devices.filter(isDeviceOnline).length;

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const name = profile?.display_name;

  return (
    <Screen>
      <ScreenHeader eyebrow={today} title={name ? `${greeting()}, ${name}` : greeting()} />

      {error && <Notice tone="error" message={error} />}

      {/* ----- The next thing to do ----- */}
      {next ? (
        <Card variant="highlight">
          <View style={styles.focusLabel}>
            <Feather name="star" size={13} color={Colors.teal} />
            <Text style={styles.focusLabelText}>Next up</Text>
          </View>
          <View style={styles.focusBody}>
            <Text style={styles.focusTitle} numberOfLines={3}>
              {next.title}
            </Text>
            <Pressable
              onPress={() => complete(next.id)}
              accessibilityRole="button"
              accessibilityLabel={`Mark "${next.title}" as done`}
              style={({ pressed }) => [styles.doneButton, pressed && styles.doneButtonPressed]}
            >
              <Feather name="check" size={26} color={Colors.white} />
            </Pressable>
          </View>
          <View style={styles.focusFooter}>
            <Feather name="clock" size={14} color={Colors.teal} />
            <Text style={styles.focusFooterText}>
              {isToday(next.due_at) ? 'Today' : new Date(next.due_at).toLocaleDateString('en-GB', { weekday: 'long' })}{' '}
              at {formatTime(next.due_at)}
              {next.details ? ` · ${next.details}` : ''}
            </Text>
          </View>
        </Card>
      ) : (
        <Card variant="highlight">
          <Text style={styles.focusTitle}>Nothing left to do.</Text>
          <Text style={styles.emptyText}>Enjoy the free time.</Text>
        </Card>
      )}

      {/* ----- Then ----- */}
      {upcoming.length > 0 && (
        <Card>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionEyebrow}>Then</Text>
              <Text style={styles.sectionTitle}>Your reminders</Text>
            </View>
            <TextLink label="See all" onPress={() => router.navigate('/reminders')} />
          </View>
          {upcoming.slice(0, PREVIEW_COUNT).map((reminder, index, shown) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              onComplete={complete}
              showDate={!isToday(reminder.due_at)}
              isLast={index === shown.length - 1}
            />
          ))}
          <Text style={styles.note}>
            {leftToday === 0
              ? 'Nothing more for today.'
              : `${leftToday} thing${leftToday > 1 ? 's' : ''} left for today.`}
          </Text>
        </Card>
      )}

      {/* ----- Devices ----- */}
      <Pressable onPress={() => router.navigate('/settings')} accessibilityRole="button">
        {({ pressed }) => (
          <Card style={[styles.devices, pressed && styles.devicesPressed]}>
            <View style={styles.devicesIcon}>
              <Feather name="box" size={20} color={Colors.ink} />
            </View>
            <View style={styles.devicesTexts}>
              <Text style={styles.devicesTitle}>
                {devices.length === 0
                  ? 'No device yet'
                  : `${onlineCount} of ${devices.length} device${devices.length > 1 ? 's' : ''} online`}
              </Text>
              <Text style={styles.devicesSubtitle}>
                {devices.length === 0 ? 'Pair your desk companion in Settings' : 'Manage alerts in Settings'}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textMuted} />
          </Card>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // ----- Focus card -----
  focusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusLabelText: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: Colors.teal,
  },
  focusBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
  },
  focusTitle: {
    flex: 1,
    fontFamily: Fonts.titleMedium,
    fontSize: 26,
    lineHeight: 30,
    color: Colors.ink,
  },
  doneButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: Colors.ink,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `3px 3px 0 ${Colors.ink}`,
  },
  doneButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    boxShadow: `1px 1px 0 ${Colors.ink}`,
  },
  focusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: 'rgba(23, 50, 77, 0.2)',
    borderStyle: 'dashed',
  },
  focusFooterText: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.teal,
  },
  emptyText: {
    marginTop: 6,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
  },

  // ----- Reminders section -----
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionEyebrow: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontFamily: Fonts.title,
    fontSize: 24,
    color: Colors.ink,
  },
  note: {
    marginTop: 10,
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // ----- Devices card -----
  devices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  devicesPressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  devicesIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.aqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devicesTexts: {
    flex: 1,
    gap: 2,
  },
  devicesTitle: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 15,
    color: Colors.text,
  },
  devicesSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
