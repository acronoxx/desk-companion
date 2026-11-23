import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import TextField from '@/components/ui/TextField';
import Toggle from '@/components/ui/Toggle';
import TopBar from '@/components/ui/TopBar';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useLanguage } from '@/hooks/useLanguage';
import { arePhoneCalendarsSupported, getPhoneCalendars } from '@/services/calendars';
import type { PhoneCalendar } from '@/types/models';

/**
 * Links outside calendars, shown read-only in the Calendar tab:
 * the calendars of the phone (Google, iCloud... accounts set up on it) and .ics links.
 */
export default function CalendarsScreen() {
  const { t } = useLanguage();
  const { settings, feedErrors, phoneError, setPhoneCalendar, addFeed, removeFeed } =
    useCalendarEvents();
  /** The phone calendars, once the user allowed the access. null = not asked yet. */
  const [phoneCalendars, setPhoneCalendars] = useState<PhoneCalendar[] | null>(null);
  const [isDenied, setIsDenied] = useState(false);
  const [isLoadingPhone, setIsLoadingPhone] = useState(false);
  const [feedName, setFeedName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const showPhoneCalendars = async () => {
    setIsLoadingPhone(true);
    try {
      const calendars = await getPhoneCalendars();
      setIsDenied(calendars === null);
      setPhoneCalendars(calendars);
    } finally {
      setIsLoadingPhone(false);
    }
  };

  const handleAddFeed = async () => {
    setAddError(null);
    setIsAdding(true);
    try {
      await addFeed(feedName, feedUrl);
      setFeedName('');
      setFeedUrl('');
    } catch (error) {
      setAddError(t.calendars.linkError(error instanceof Error ? error.message : ''));
    } finally {
      setIsAdding(false);
    }
  };

  if (!settings) {
    return (
      <Screen tabBar={false}>
        <TopBar title={t.calendars.title} />
        <ActivityIndicator color={Colors.teal} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen tabBar={false}>
      <TopBar title={t.calendars.title} />
      <Text style={styles.intro}>{t.calendars.intro}</Text>

      {/* ----- Phone calendars ----- */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t.calendars.phoneTitle}</Text>
        <Text style={styles.hint}>{t.calendars.phoneHint}</Text>

        {!arePhoneCalendarsSupported ? (
          <Text style={styles.hint}>{t.calendars.phoneWeb}</Text>
        ) : phoneCalendars === null ? (
          <>
            {isDenied && <Notice tone="error" message={t.calendars.denied} />}
            <Button
              label={t.calendars.choose}
              icon="calendar"
              variant="secondary"
              onPress={showPhoneCalendars}
              loading={isLoadingPhone}
            />
          </>
        ) : phoneCalendars.length === 0 ? (
          <Text style={styles.hint}>{t.calendars.noneFound}</Text>
        ) : (
          phoneCalendars.map((calendar, index) => (
            <View
              key={calendar.id}
              style={[styles.row, index < phoneCalendars.length - 1 && styles.separator]}>
              <View style={[styles.swatch, { backgroundColor: calendar.color }]} />
              <View style={styles.rowTexts}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {calendar.title}
                </Text>
                {calendar.accountName !== '' && (
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {calendar.accountName}
                  </Text>
                )}
              </View>
              <Toggle
                label={calendar.title}
                value={settings.phoneCalendarIds.includes(calendar.id)}
                onChange={(isShown) => setPhoneCalendar(calendar.id, isShown)}
              />
            </View>
          ))
        )}
        {phoneError && <Notice tone="error" message={phoneError} />}
      </Card>

      {/* ----- .ics links ----- */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t.calendars.linksTitle}</Text>
        <Text style={styles.hint}>{t.calendars.linksHint}</Text>

        {settings.icsFeeds.map((feed) => (
          <View key={feed.id} style={[styles.row, styles.separator]}>
            <Feather name="link" size={16} color={Colors.teal} />
            <View style={styles.rowTexts}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {feed.name}
              </Text>
              <Text
                style={[styles.rowMeta, feedErrors[feed.id] && styles.rowError]}
                numberOfLines={1}>
                {feedErrors[feed.id] ?? feed.url}
              </Text>
            </View>
            <Pressable
              onPress={() => removeFeed(feed.id)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t.calendars.remove(feed.name)}>
              <Feather name="trash-2" size={18} color={Colors.coral} />
            </Pressable>
          </View>
        ))}

        <TextField
          label={t.calendars.linkName}
          value={feedName}
          onChangeText={setFeedName}
          placeholder={t.calendars.linkNamePlaceholder}
          maxLength={40}
        />
        <TextField
          label={t.calendars.link}
          value={feedUrl}
          onChangeText={setFeedUrl}
          placeholder={t.calendars.linkPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {addError && <Notice tone="error" message={addError} />}
        <Button
          label={t.calendars.addLink}
          icon="plus"
          variant="secondary"
          onPress={handleAddFeed}
          loading={isAdding}
          disabled={feedUrl.trim() === ''}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 40,
  },
  intro: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.title,
    fontSize: 22,
    color: Colors.ink,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },

  // ----- Rows -----
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  rowMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  rowError: {
    color: Colors.coral,
  },
});
