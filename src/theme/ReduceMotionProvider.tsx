import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

const ReduceMotionContext = createContext(false);

/**
 * Tracks the phone's "remove animations" setting with one listener for the whole app,
 * and updates live if the user changes it while Vinco is open.
 */
export function ReduceMotionProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isActive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isActive) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  return <ReduceMotionContext value={reduceMotion}>{children}</ReduceMotionContext>;
}

/** True when the user asked the phone to reduce motion. Animated components then jump to their end state. */
export function useReduceMotion(): boolean {
  return use(ReduceMotionContext);
}
