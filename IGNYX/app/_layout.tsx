import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="boot" />
        <Stack.Screen name="profiling" />
        <Stack.Screen name="shell" />
        <Stack.Screen name="terminal" />
        <Stack.Screen name="filesystem" />
        <Stack.Screen name="mission" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="events" />
        <Stack.Screen name="profile" />
      </Stack>
    </>
  );
}
