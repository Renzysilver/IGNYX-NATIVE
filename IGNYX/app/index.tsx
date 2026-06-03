// IGNYX Route Director — Module 10 + Module 15
// Hydrate persisted state. Then route: boot → profiling → endgame? → shell.
// The system remembers. The operator returns. The story has endings.

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
  const gameOverTriggered = useGameStore((s) => s.gameOverTriggered);
  const victoryTriggered = useGameStore((s) => s.victoryTriggered);

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

  // Endgame routing (Module 15)
  // Game over takes priority over victory (shouldn't happen simultaneously, but just in case)
  if (gameOverTriggered) {
    return <Redirect href="/gameover" />;
  }
  if (victoryTriggered) {
    return <Redirect href="/victory" />;
  }

  // Standard routing: boot → profiling → shell
  if (!hasBooted) {
    return <Redirect href="/boot" />;
  }
  if (!hasProfiled) {
    return <Redirect href="/profiling" />;
  }
  return <Redirect href="/shell" />;
}
