import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabBarIcon from '@/components/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useLanguage } from '@/hooks/useLanguage';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.ink,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        // The icon box must be as big as the yellow pill of TabBarIcon,
        // otherwise the pill spills over the label.
        tabBarIconStyle: styles.icon,
        // Floating bar: lifted above the home indicator, the screens scroll under it.
        tabBarStyle: [styles.bar, { bottom: Math.max(insets.bottom, 10) }],
        sceneStyle: { backgroundColor: Colors.bg },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.today,
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: t.tabs.reminders,
          tabBarIcon: ({ focused }) => <TabBarIcon name="check-square" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.tabs.calendar,
          tabBarIcon: ({ focused }) => <TabBarIcon name="calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ focused }) => <TabBarIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    marginHorizontal: 12,
    height: 80,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 22,
    borderTopWidth: 2,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
    boxShadow: `4px 4px 0 ${Colors.ink}`,
    elevation: 0,
  },
  item: {
    gap: 2,
  },
  icon: {
    width: 48,
    height: 34,
  },
  label: {
    marginTop: 4,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
  },
});
