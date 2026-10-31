import { useEffect, useEffectEvent } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { noticesCopy } from '@/copy';
import type { Notice, NoticeKind } from '@/features/notices';
import {
  type ColorRole,
  createStyles,
  themeSpring,
  themeTiming,
  useFeedback,
  useReduceMotion,
  useTheme,
} from '@/theme';

import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Txt } from '../Txt';

export type NoticePillProps = {
  notice: Notice;
  /** The pill has left the screen (time up, swiped away, tapped, or its action taken). */
  onGone: (key: string) => void;
};

const KINDS: Record<NoticeKind, { icon: IconName; color: ColorRole }> = {
  success: { icon: 'check', color: 'accent' },
  reward: { icon: 'coin', color: 'currency' },
  info: { icon: 'info', color: 'info' },
  warning: { icon: 'warning', color: 'accent' },
  error: { icon: 'alert', color: 'danger' },
};

/** The widest a pill grows on a big phone or tablet, so it stays a capsule, not a banner. */
const MAX_WIDTH = 440;
/** A swipe up this far, or this fast, sends it away; otherwise it springs back. */
const SWIPE = { distance: 24, velocity: 500 } as const;
/** Pulling down only gives a little: the pill is anchored to the top. */
const PULL_DOWN_RESISTANCE = 0.2;
/** How far it travels up while leaving, past the status bar. */
const AWAY = 120;

/**
 * One notice: a quiet capsule under the status bar with the kind's icon, one or two lines and an
 * optional compact action. Springs in from above, leaves upwards when its time is up, when it is
 * tapped or swiped up, or when the action is taken. A repeat bumps it gently and shows "x2".
 * Reduce motion: it fades in and out.
 */
export function NoticePill({ notice, onGone }: NoticePillProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const reduceMotion = useReduceMotion();
  const shown = useSharedValue(0);
  const drag = useSharedValue(0);
  const bump = useSharedValue(1);
  const kind = KINDS[notice.kind];
  const rise = theme.space.huge;
  const { key, action, count } = notice;

  const leave = () => {
    const finish = () => onGone(key);
    shown.set(
      withTiming(0, themeTiming('fast', 'exit'), (finished) => {
        if (finished) scheduleOnRN(finish);
      }),
    );
  };
  const onTimeUp = useEffectEvent(leave);

  // In on every fresh show, and back in when a repeat arrives mid-exit.
  useEffect(() => {
    drag.set(withSpring(0, themeSpring('settle')));
    shown.set(reduceMotion ? withTiming(1, themeTiming('fast')) : withSpring(1, themeSpring('settle')));
    if (!reduceMotion && count > 1) {
      bump.set(withSequence(withSpring(1.04, themeSpring('press')), withSpring(1, themeSpring('settle'))));
    }
  }, [notice.seq, count, reduceMotion, shown, drag, bump]);

  useEffect(() => {
    if (notice.expiresAt == null) return;
    const timer = setTimeout(onTimeUp, Math.max(0, notice.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [notice.expiresAt, notice.seq]);

  const pan = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .failOffsetX([-24, 24])
    .onUpdate((event) => {
      drag.set(event.translationY < 0 ? event.translationY : event.translationY * PULL_DOWN_RESISTANCE);
    })
    .onEnd((event) => {
      if (event.translationY < -SWIPE.distance || event.velocityY < -SWIPE.velocity) {
        drag.set(
          withTiming(-AWAY, themeTiming('fast', 'exit'), (finished) => {
            if (finished) scheduleOnRN(onGone, key);
          }),
        );
      } else {
        drag.set(withSpring(0, themeSpring('settle')));
      }
    });

  const style = useAnimatedStyle(() => {
    const away = Math.min(1, Math.max(0, -drag.get() / AWAY));
    const enter = reduceMotion ? 0 : (1 - shown.get()) * -rise;
    return {
      opacity: shown.get() * (1 - away),
      transform: [{ translateY: enter + drag.get() }, { scale: bump.get() }],
    };
  });

  const handleAction = () => {
    if (!action) return;
    play('tap');
    leave();
    action.onPress();
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.pill, style]}>
        <PressableScale
          scaleTo="row"
          onPress={leave}
          accessibilityLabel={noticesCopy.spoken(noticesCopy.kinds[notice.kind], notice.message, count)}
          accessibilityHint={noticesCopy.dismissHint}
          containerStyle={styles.bodyArea}
          style={styles.body}
        >
          <Icon name={kind.icon} size={theme.layout.iconSizeSmall} color={kind.color} strokeWidth={2} />
          <Txt variant="label" numberOfLines={2} style={styles.message}>
            {notice.message}
          </Txt>
          {count > 1 ? (
            <View style={styles.count}>
              <Txt variant="micro" color="textMuted">
                {noticesCopy.count(count)}
              </Txt>
            </View>
          ) : null}
        </PressableScale>
        {action ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={handleAction}
            hitSlop={theme.space.sm}
            style={styles.action}
          >
            <Txt variant="labelSmall" color={notice.kind === 'error' ? 'danger' : 'accent'} numberOfLines={1}>
              {action.label}
            </Txt>
          </PressableScale>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const useStyles = createStyles((theme) => ({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: MAX_WIDTH,
    minHeight: theme.layout.minTouchTarget,
    paddingLeft: theme.space.md,
    paddingRight: theme.space.xs,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
    backgroundColor: theme.colors.surfaceRaised,
    boxShadow: theme.effects.cardShadow,
  },
  bodyArea: { flexShrink: 1 },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingVertical: theme.space.sm,
    paddingRight: theme.space.sm,
  },
  message: { flexShrink: 1 },
  count: {
    paddingHorizontal: theme.space.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
  action: {
    minHeight: theme.layout.chipHeight,
    justifyContent: 'center',
    paddingHorizontal: theme.space.md,
    marginLeft: theme.space.xxs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
}));
