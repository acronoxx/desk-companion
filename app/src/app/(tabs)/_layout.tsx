import { Tabs } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.bg },
        tabBarActiveTintColor: Colors.ink,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarActiveBackgroundColor: Colors.yellow,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 2,
          borderTopColor: Colors.ink,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: Fonts.bodyBlack },
        tabBarItemStyle: { borderRadius: 14, marginVertical: 6, marginHorizontal: 4 },
        tabBarIconStyle: { display: 'none' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="reminders" options={{ title: 'Rappels' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="settings" options={{ title: 'Réglages' }} />
    </Tabs>
  );
}
