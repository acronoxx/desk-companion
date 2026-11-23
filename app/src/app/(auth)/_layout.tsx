import { Stack } from 'expo-router';

// Without an index screen in this group, tell the router which screen opens first.
export const unstable_settings = {
  anchor: 'login', // SDK 58 name of initialRouteName
};

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
