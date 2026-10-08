import * as Haptics from 'expo-haptics';

import type { HapticPattern } from '../types';

/** Plays a haptic pattern. Never throws: some phones have no vibration motor. */
export function playHaptic(pattern: HapticPattern): void {
  const run = getHapticCall(pattern);
  if (!run) return;
  run().catch((error: unknown) => {
    if (__DEV__) console.warn(`[feedback] Haptic "${pattern}" failed.`, error);
  });
}

function getHapticCall(pattern: HapticPattern): (() => Promise<void>) | null {
  switch (pattern) {
    case 'none':
      return null;
    case 'selection':
      return () => Haptics.selectionAsync();
    case 'light':
      return () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'medium':
      return () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'heavy':
      return () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    case 'success':
      return () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case 'warning':
      return () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    case 'error':
      return () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}
