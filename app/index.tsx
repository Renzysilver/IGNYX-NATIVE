import { Redirect } from 'expo-router';
import { useGameStore } from '../store/useGameStore';

export default function Index() {
  const hasBooted = useGameStore((s) => s.hasBooted);
  const hasProfiled = useGameStore((s) => s.hasProfiled);

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
