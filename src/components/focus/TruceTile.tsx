import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { RollingNumber } from '@/components/RollingNumber';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { cardSurface, createStyles, useReduceMotion, useTheme } from '@/theme';

export type TruceTileProps = {
  /** Truces held now (live: one bought in the Forum shows at once). */
  count: number;
  /**
   * Goes up by one each time a retreat was refused for want of a Truce: the tile shakes (with
   * reduce motion, its colour pulses instead). 0: never refused.
   */
  alertKey: number;
  /** Opens the buy-a-Truce sheet. Offered only when none is held. */
  onBuy: () => void;
};

/** How far the tile swings each way, as a share of the small spacing step. */
const SHAKE_STEPS = 4;
const SHAKE_SWING_MS = 70;

/**
 * The Truces held on the running focus. With none held it carries a "+" and opens the buy sheet:
 * ending a focus early spends a Truce. Refused retreats shake it (a few short swings on the UI
 * thread, no callbacks) and pulse its colour.
 */
export function TruceTile({ count, alertKey, onBuy }: TruceTileProps) {
  const theme = useTheme();
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const shake = useSharedValue(0);
  const pulse = useSharedValue(0);
  const needsTruce = !(count >= 1);
  const swing = theme.space.sm;
  const restBorder = theme.effects.cardBorder;
  const restFill = theme.colors.surface;
  const alertBorder = theme.colors.danger;
  const alertFill = theme.colors.dangerSoft;

  useEffect(() => {
    if (alertKey === 0) return;
    pulse.set(withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 900 })));
    if (reduceMotion) return;
    shake.set(
      withSequence(
        withTiming(-1, { duration: SHAKE_SWING_MS / 2 }),
        withRepeat(withTiming(1, { duration: SHAKE_SWING_MS }), SHAKE_STEPS, true),
        withTiming(0, { duration: SHAKE_SWING_MS / 2 }),
      ),
    );
  }, [alertKey, reduceMotion, shake, pulse]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() * swing }] }));
  const surfaceStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(pulse.get(), [0, 1], [restBorder, alertBorder]),
    backgroundColor: interpolateColor(pulse.get(), [0, 1], [restFill, alertFill]),
  }));

  const body = (
    <Animated.View style={[styles.tile, surfaceStyle]}>
      <Txt variant="overline" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {focusCopy.active.truces}
      </Txt>
      <RollingNumber value={String(Math.max(0, Math.floor(count) || 0))} variant="heading" />
      {needsTruce ? (
        <View style={styles.badge}>
          <Icon name="plus" color="onAccent" size={theme.layout.iconSizeSmall} strokeWidth={2.6} />
        </View>
      ) : null}
    </Animated.View>
  );

  return (
    <Animated.View style={[styles.wrap, shakeStyle]}>
      {needsTruce ? (
        <PressableScale
          scaleTo="card"
          accessibilityRole="button"
          accessibilityLabel={focusCopy.active.buyTruce}
          accessibilityHint={focusCopy.active.buyTruceHint}
          onPress={onBuy}
          containerStyle={styles.fill}
          style={styles.fill}
        >
          {body}
        </PressableScale>
      ) : (
        <View style={styles.fill} accessible accessibilityLabel={focusCopy.active.trucesLabel(count)}>
          {body}
        </View>
      )}
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { flex: 1 },
  fill: { flex: 1 },
  tile: {
    flex: 1,
    justifyContent: 'space-between',
    gap: theme.space.xxs,
    minHeight: theme.layout.minTouchTarget * 2,
    padding: theme.layout.cardPadding,
    ...cardSurface(theme),
  },
  badge: {
    position: 'absolute',
    top: theme.space.sm,
    right: theme.space.sm,
    width: theme.layout.statusCircleSize,
    height: theme.layout.statusCircleSize,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
}));
