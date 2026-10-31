import { useIsFocused } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';

/**
 * Counts how many times the screen this component sits on has come back into focus: a tab
 * picked again, or a screen closed over it. The first mount does not count, so nothing plays
 * twice on open. Pass `onReturn` to run a small motion on each return (check reduce motion in it);
 * or key an entering animation by the count.
 */
export function useTabReturn(onReturn?: () => void): number {
  const isFocused = useIsFocused();
  const [focus, setFocus] = useState({ isFocused, returns: 0 });

  // Adjust state while rendering (React's pattern for "state from a changed value"), no effect needed.
  if (focus.isFocused !== isFocused) {
    setFocus({ isFocused, returns: isFocused ? focus.returns + 1 : focus.returns });
  }

  const handleReturn = useEffectEvent(() => onReturn?.());
  useEffect(() => {
    if (focus.returns > 0) handleReturn();
  }, [focus.returns]);

  return focus.returns;
}
