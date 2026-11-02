import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTabSettle } from '@/hooks/useTabSettle';

export type TabSettleProps = {
  /** Place in the screen's stagger, top left first (0, 1, 2...). */
  order?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Wraps a card or tile so it settles into place each time the user comes back to the tab. */
export function TabSettle({ order = 0, style, children }: TabSettleProps) {
  const settle = useTabSettle(order);
  return <Animated.View style={[style, settle]}>{children}</Animated.View>;
}
