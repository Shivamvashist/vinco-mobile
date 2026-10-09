import { useEffect } from 'react';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { createStyles, useReduceMotion } from '@/theme';

import { Txt } from './Txt';

export type ToastProps = {
  /** The message to show, or null for none. A new message restarts the timer. */
  message: string | null;
  onHide: () => void;
};

const VISIBLE_MS = 2400;

/** A short confirmation that rises, waits and leaves. Announced politely to screen readers. */
export function Toast({ message, onHide }: ToastProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onHide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, onHide]);

  if (!message) return null;

  return (
    <Animated.View
      key={message}
      entering={reduceMotion ? undefined : FadeInDown.duration(250)}
      exiting={reduceMotion ? undefined : FadeOutDown.duration(200)}
      style={styles.toast}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <Txt variant="labelSmall" color="onInverse" align="center">
        {message}
      </Txt>
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  toast: {
    position: 'absolute',
    left: theme.layout.flowGutter,
    right: theme.layout.flowGutter,
    bottom: theme.space.huge * 3,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.inverse,
  },
}));
