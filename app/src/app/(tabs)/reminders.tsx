import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import ReminderRow from '@/components/ReminderRow';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useActionError } from '@/hooks/useActionError';
import { useLanguage } from '@/hooks/useLanguage';
import { useReminders } from '@/hooks/useReminders';
import type { Reminder } from '@/types/models';
import type { Strings } from '@/i18n/en';

type Status = 'todo' | 'done' | 'all';
type Kind = 'any' | 'once' | 'repeating';
type Sort = 'soonest' | 'latest' | 'newest' | 'title';

/** The choices of each control, with the key of their label in t.reminders. */
const STATUSES = [
  { value: 'todo', key: 'statusTodo' },
  { value: 'done', key: 'statusDone' },
  { value: 'all', key: 'statusAll' },
] as const;

const KINDS = [
  { value: 'any', key: 'kindAny' },
  { value: 'once', key: 'kindOnce' },
  { value: 'repeating', key: 'kindRepeating' },
] as const;

const SORTS = [
  { value: 'soonest', key: 'sortSoonest' },
  { value: 'latest', key: 'sortLatest' },
  { value: 'newest', key: 'sortNewest' },
  { value: 'title', key: 'sortTitle' },
] as const;

/** Compare function of each sort. ISO dates compare as strings. */
const COMPARE: Record<Sort, (a: Reminder, b: Reminder) => number> = {
  soonest: (a, b) => a.due_at.localeCompare(b.due_at),
  latest: (a, b) => b.due_at.localeCompare(a.due_at),
  newest: (a, b) => b.created_at.localeCompare(a.created_at),
  title: (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }),
};

type DayGroup = { key: string; label: string; reminders: Reminder[] };

/** Label of a day section: "Overdue", "Today", "Tomorrow" or the date. */
function dayLabel(date: Date, isOverdue: boolean, t: Strings, locale: string): string {
  if (isOverdue) return t.common.overdue;
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return t.common.today;
  if (date.toDateString() === tomorrow.toDateString()) return t.common.tomorrow;
  return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Splits reminders (already sorted by due date) into one group per day. Late ones stay together. */
function groupByDay(reminders: Reminder[], t: Strings, locale: string): DayGroup[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const groups: DayGroup[] = [];

  for (const reminder of reminders) {
    const due = new Date(reminder.due_at);
    const isOverdue = reminder.completed_at === null && due < startOfToday;
    const key = isOverdue ? 'overdue' : due.toDateString();
    const last = groups[groups.length - 1];

    if (last?.key === key) {
      last.reminders.push(reminder);
    } else {
      groups.push({ key, label: dayLabel(due, isOverdue, t, locale), reminders: [reminder] });
    }
  }
  return groups;
}

export default function RemindersScreen() {
  const { t, locale } = useLanguage();
  const { reminders, error, complete } = useReminders();
  const { actionError, run } = useActionError();
  const [status, setStatus] = useState<Status>('todo');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<Kind>('any');
  const [sort, setSort] = useState<Sort>('soonest');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const todoCount = reminders.filter((reminder) => reminder.completed_at === null).length;
  const query = search.trim().toLowerCase();
  const shown = reminders
    .filter((reminder) => {
      if (status === 'todo' && reminder.completed_at !== null) return false;
      if (status === 'done' && reminder.completed_at === null) return false;
      if (kind === 'once' && reminder.recurrence !== null) return false;
      if (kind === 'repeating' && reminder.recurrence === null) return false;
      if (query === '') return true;
      return (
        reminder.title.toLowerCase().includes(query) ||
        (reminder.details?.toLowerCase().includes(query) ?? false)
      );
    })
    .sort(COMPARE[sort]);

  // Day sections only make sense when the list is in date order.
  const isByDate = sort === 'soonest' || sort === 'latest';
  const groups = isByDate ? groupByDay(shown, t, locale) : [];
  /** Number of panel settings changed from the default, shown on the panel button. */
  const activeCount = (kind !== 'any' ? 1 : 0) + (sort !== 'soonest' ? 1 : 0);
  const isFiltered = query !== '' || kind !== 'any';

  const resetPanel = () => {
    setKind('any');
    setSort('soonest');
  };

  const handleComplete = (reminderId: string) =>
    run(() => complete(reminderId), t.reminders.completeError);

  const openReminder = (reminderId: string) =>
    router.push({ pathname: '/reminders/[id]', params: { id: reminderId } });

  return (
    <Screen>
      <ScreenHeader
        eyebrow={t.reminders.eyebrow}
        title={t.reminders.title}
        right={
          <View style={styles.headerRight}>
            <Badge label={t.reminders.todoBadge(todoCount)} />
            <Pressable
              onPress={() => router.push('/reminders/new')}
              accessibilityRole="button"
              accessibilityLabel={t.reminders.newReminder}
              style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}>
              <Feather name="plus" size={22} color={Colors.ink} />
            </Pressable>
          </View>
        }
      />

      {/* ----- Search and filter button ----- */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.reminders.search}
            placeholderTextColor={Colors.textLight}
            returnKeyType="search"
            accessibilityLabel={t.reminders.search}
            style={styles.searchInput}
          />
          {search !== '' && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t.reminders.clearSearch}
              style={styles.searchClear}>
              <Feather name="x" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setIsPanelOpen(!isPanelOpen)}
          accessibilityRole="button"
          accessibilityLabel={t.reminders.filterAndSort}
          accessibilityState={{ expanded: isPanelOpen }}
          style={({ pressed }) => [
            styles.panelButton,
            (isPanelOpen || activeCount > 0) && styles.panelButtonOn,
            pressed && styles.panelButtonPressed,
          ]}>
          <Feather name="sliders" size={20} color={Colors.ink} />
          {activeCount > 0 && (
            <View style={styles.panelCount}>
              <Text style={styles.panelCountText}>{activeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ----- Filter and sort panel ----- */}
      {isPanelOpen && (
        <Card style={styles.panel}>
          <View style={styles.panelGroup}>
            <Text style={styles.panelLabel}>{t.reminders.show}</Text>
            <View style={styles.chips}>
              {KINDS.map((option) => (
                <Chip
                  key={option.value}
                  label={t.reminders[option.key]}
                  icon={option.value === 'repeating' ? 'repeat' : undefined}
                  selected={kind === option.value}
                  onPress={() => setKind(option.value)}
                />
              ))}
            </View>
          </View>
          <View style={styles.panelGroup}>
            <Text style={styles.panelLabel}>{t.reminders.sortBy}</Text>
            <View style={styles.chips}>
              {SORTS.map((option) => (
                <Chip
                  key={option.value}
                  label={t.reminders[option.key]}
                  selected={sort === option.value}
                  onPress={() => setSort(option.value)}
                />
              ))}
            </View>
          </View>
          {activeCount > 0 && (
            <Pressable
              onPress={resetPanel}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.reset}>
              <Text style={styles.resetLabel}>{t.reminders.reset}</Text>
            </Pressable>
          )}
        </Card>
      )}

      <SegmentedControl
        options={STATUSES.map((option) => ({
          value: option.value,
          label: t.reminders[option.key],
        }))}
        value={status}
        onChange={setStatus}
      />

      {error && <Notice tone="error" message={error} />}
      {actionError && <Notice tone="error" message={actionError} />}

      {shown.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>
            {isFiltered
              ? t.reminders.noMatch
              : status === 'done'
                ? t.reminders.nothingDone
                : t.reminders.allClear}
          </Text>
          <Text style={styles.emptyText}>
            {isFiltered
              ? t.reminders.tryAnother
              : status === 'done'
                ? t.reminders.doneShowHere
                : t.reminders.enjoy}
          </Text>
        </Card>
      ) : !isByDate ? (
        // Sorted by title or creation: one flat list, each row shows its date.
        <Card style={styles.group}>
          <View style={styles.groupBody}>
            {shown.map((reminder, index) => (
              <ReminderRow
                key={reminder.id}
                reminder={reminder}
                onComplete={handleComplete}
                onPress={openReminder}
                showDate
                isLast={index === shown.length - 1}
              />
            ))}
          </View>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.key} style={styles.group}>
            <View
              style={[styles.groupHeader, group.key === 'overdue' && styles.groupHeaderOverdue]}>
              <Text
                style={[styles.groupLabel, group.key === 'overdue' && styles.groupLabelOverdue]}>
                {group.label}
              </Text>
              <Text style={styles.groupCount}>{group.reminders.length}</Text>
            </View>
            <View style={styles.groupBody}>
              {group.reminders.map((reminder, index) => (
                <ReminderRow
                  key={reminder.id}
                  reminder={reminder}
                  onComplete={handleComplete}
                  onPress={openReminder}
                  showDate={group.key === 'overdue'}
                  isLast={index === group.reminders.length - 1}
                />
              ))}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // ----- Header -----
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `3px 3px 0 ${Colors.ink}`,
  },
  newButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    boxShadow: `1px 1px 0 ${Colors.ink}`,
  },

  // ----- Search -----
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
    boxShadow: `4px 4px 0 ${Colors.line}`,
  },
  searchIcon: {
    paddingHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  searchClear: {
    paddingHorizontal: 8,
  },
  panelButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `4px 4px 0 ${Colors.line}`,
  },
  panelButtonOn: {
    backgroundColor: Colors.green,
  },
  panelButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    boxShadow: `2px 2px 0 ${Colors.line}`,
  },
  panelCount: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelCountText: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 11,
    color: Colors.ink,
  },

  // ----- Filter and sort panel -----
  panel: {
    gap: 16,
  },
  panelGroup: {
    gap: 10,
  },
  panelLabel: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 13,
    color: Colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reset: {
    alignSelf: 'flex-start',
  },
  resetLabel: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 13,
    color: Colors.teal,
  },

  // ----- Day group -----
  group: {
    padding: 0,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  groupHeaderOverdue: {
    backgroundColor: Colors.white,
  },
  groupLabel: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  groupLabelOverdue: {
    color: Colors.coral,
  },
  groupCount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.textMuted,
  },
  groupBody: {
    paddingHorizontal: 18,
  },

  // ----- Empty state -----
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
