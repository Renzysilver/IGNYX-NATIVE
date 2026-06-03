// IGNYX Root Layout — Module 16
// Error boundary wraps the entire app. If any screen crashes,
// the system degrades gracefully instead of hard-crashing.

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useGameStore } from '../store/useGameStore';
import { useRouter } from 'expo-router';

function RootLayoutInner() {
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
        <Stack.Screen name="gameover" />
        <Stack.Screen name="victory" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Could be extended to log to a remote service
        console.error('[IGNYX Fatal]', error.message, errorInfo.componentStack);
      }}
      onReset={() => {
        resetGame();
      }}
    >
      <RootLayoutInner />
    </ErrorBoundary>
  );
}
