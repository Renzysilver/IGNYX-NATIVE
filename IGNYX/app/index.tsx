// IGNYX Route Director — Module 10
// Hydrate persisted state. Then route: boot → profiling → shell.
// The system remembers. The operator returns.

import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useGameStore } from '../store/useGameStore';
import { Colors } from '../constants/colors';

export default function Index() {
  const hasBooted = useGameStore((s) => s.hasBooted);
  const hasProfiled = useGameStore((s) => s.hasProfiled);
  const hasHydrated = useGameStore((s) => s.hasHydrated);
  const hydrateState = useGameStore((s) => s.hydrateState);

  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      await hydrateState();
      setIsHydrating(false);
    };
    hydrate();
  }, []);

  // Show loading screen while hydrating persisted state
  if (isHydrating || !hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={Colors.cyan} />
      </View>
    );
  }

  // First time: go to boot
  // After boot but before profiling: go to profiling
  // After profiling: go to shell
  if (!hasBooted) {
    return <Redirect href="/boot" />;
  }
  if (!hasProfiled) {
    return <Redirect href="/profiling" />;
  }
  return <Redirect href="/shell" />;
}
