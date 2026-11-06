import type { ReactNode } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useEntrance } from '@/hooks/useEntrance';
import { useTheme } from '@/theme';

export type SegmentRiseProps = { children: ReactNode };

/**
 * The content of a Shop tab rising into place when the tab is picked (key it by the tab so it
 * replays). useEntrance guarantees it ends fully shown, also if the app goes to the background
 * mid-way; with reduce motion it simply appears.
 */
export function SegmentRise({ children }: SegmentRiseProps) {
  const theme = useTheme();
  const enter = useEntrance();
  const rise = theme.space.lg;

  const style = useAnimatedStyle(() => ({
    opacity: enter.get(),
    transform: [{ translateY: (1 - enter.get()) * rise }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
