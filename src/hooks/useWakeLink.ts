import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

/**
 * Today opened as /veni?wake=1 (the "Are you up?" notification): calls `openWake` once per link
 * when the day is read and still at dawn, then clears the link on this screen (the global router
 * can't navigate yet on a cold start from the notification). Handled while rendering, not in an
 * effect, so the sheet opens on the first paint.
 */
export function useWakeLink(isLoaded: boolean, isDawn: boolean, openWake: () => void): void {
  const { wake } = useLocalSearchParams<{ wake?: string }>();
  const navigation = useNavigation();
  const isWakeLink = wake === '1';
  const [hasHandled, setHasHandled] = useState(false);
  if (isWakeLink && isLoaded && !hasHandled) {
    setHasHandled(true);
    if (isDawn) openWake();
  }
  if (!isWakeLink && hasHandled) setHasHandled(false);
  useEffect(() => {
    if (isWakeLink && hasHandled) navigation.setParams({ wake: undefined } as never);
  }, [isWakeLink, hasHandled, navigation]);
}
