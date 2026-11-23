// app/_layout.tsx
import { useEffect, useRef } from 'react';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { CalendarEventsProvider } from '@/hooks/useCalendarEvents';
import { DevicesProvider } from '@/hooks/useDevices';
import { LanguageProvider } from '@/hooks/useLanguage';
import { ProfileProvider } from '@/hooks/useProfile';
import { RemindersProvider } from '@/hooks/useReminders';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return null; // le splash reste affiché
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </LanguageProvider>
  );
}

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const isLoggedIn = user !== null;
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // On sign out (or an expired session), the screen that was open is now protected. The (auth)
  // group has no "/" screen, so without this the router would land on "Unmatched route".
  useEffect(() => {
    if (isLoading) return;
    if (wasLoggedIn.current && !isLoggedIn) router.replace('/login');
    wasLoggedIn.current = isLoggedIn;
  }, [isLoading, isLoggedIn]);

  if (isLoading) {
    return null; // on restaure la session, le splash reste affiché
  }

  // The data providers wrap every screen (tabs and the reminder/device screens outside them).
  // The key remounts them (and everything inside) when the user changes,
  // so nothing from the previous account is kept.
  const dataKey = user?.id ?? 'logged-out';

  return (
    <ProfileProvider key={dataKey}>
      <RemindersProvider>
        <DevicesProvider>
          <CalendarEventsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={isLoggedIn}>
                <Stack.Screen name="(tabs)" />
                {/* Opened on top of the tabs, with their own back button (TopBar). */}
                <Stack.Screen name="reminders/new" options={{ presentation: 'modal' }} />
                <Stack.Screen name="reminders/[id]" />
                <Stack.Screen name="devices/pair" options={{ presentation: 'modal' }} />
                <Stack.Screen name="devices/[id]" />
                <Stack.Screen name="calendars" />
              </Stack.Protected>
              <Stack.Protected guard={!isLoggedIn}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
            </Stack>
          </CalendarEventsProvider>
        </DevicesProvider>
      </RemindersProvider>
    </ProfileProvider>
  );
}
