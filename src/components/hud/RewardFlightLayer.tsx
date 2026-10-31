import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import {
  type ColorRole,
  createStyles,
  motion,
  themeSpring,
  useFeedback,
  useReduceMotion,
  useTheme,
} from '@/theme';

import { Icon, type IconName } from '../Icon';
import { Txt } from '../Txt';

import {
  claimLandingCue,
  type FlightGroup,
  landGlyph,
  REWARD_KINDS,
  type RewardKind,
  setFlightLayerReady,
  useRewardFlight,
} from './rewardFlight';

const GLYPHS: Record<RewardKind, { icon: IconName; color: ColorRole }> = {
  denarii: { icon: 'coin', color: 'currency' },
  gloria: { icon: 'laurel', color: 'accent' },
  truces: { icon: 'shield', color: 'info' },
};

/** The burst, then the hold so the rewards can be read, then the slingshot. */
const TIMING = { hold: 350, stagger: 45, pullBack: 120, labelFade: motion.duration.fast } as const;
/** How far behind the start a glyph is drawn back before it flies (as a share of the path). */
const PULL_BACK = -0.18;
/** Golden angle, so glyphs spread evenly without randomness. */
const SPREAD_ANGLE = 2.39996;
/** The fast arc: a stiff spring that stops at the counter rather than passing it. */
const SLINGSHOT = { damping: 20, stiffness: 140, mass: 0.7, overshootClamping: true };

/**
 * The reward flight, drawn above every screen (root layout). Each claim's rewards burst out at the
 * claim button and pop their amount, hold for a moment, then each kind is pulled back and
 * slingshots to its own counter; every landing ticks the counter. Coins land with the `coin` cue,
 * the others with `tap`, thinned out (shouldCueLanding) so a big claim never buzzes on and on.
 * Draws nothing, and lets nothing fly, with reduce motion on.
 */
export function RewardFlightLayer() {
  const reduceMotion = useReduceMotion();
  const flight = useRewardFlight();

  useEffect(() => {
    setFlightLayerReady(!reduceMotion);
    return () => setFlightLayerReady(false);
  }, [reduceMotion]);

  if (reduceMotion) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {flight.groups.map((group) => (group.to ? <Group key={group.id} group={group} /> : null))}
    </View>
  );
}

function Group({ group }: { group: FlightGroup }) {
  return (
    <>
      <AmountPop group={group} />
      {Array.from({ length: group.glyphs }, (_, index) => (
        <Glyph key={index} group={group} index={index} />
      ))}
    </>
  );
}

/** The amount, popped near the claim and faded once the glyphs leave. */
function AmountPop({ group }: { group: FlightGroup }) {
  const styles = useStyles();
  const theme = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const glyph = GLYPHS[group.kind];
  const column = REWARD_KINDS.indexOf(group.kind) - 1;
  const left = group.from.x + column * theme.space.giant;
  const top = group.from.y - theme.space.giant;

  useEffect(() => {
    scale.set(withSpring(1, themeSpring('pop')));
    opacity.set(withDelay(TIMING.hold + TIMING.pullBack, withTiming(0, { duration: TIMING.labelFade })));
  }, [opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: left }, { translateY: top }, { translateX: '-50%' }, { scale: scale.get() }],
  }));

  return (
    <Animated.View style={[styles.pop, style]}>
      <Icon name={glyph.icon} size={theme.layout.iconSizeSmall} color={glyph.color} />
      <Txt variant="label" color={glyph.color}>{`+${group.amount}`}</Txt>
    </Animated.View>
  );
}

/** One coin, spark or shield: bursts out, waits, is pulled back, then flies to its counter. */
function Glyph({ group, index }: { group: FlightGroup; index: number }) {
  const styles = useStyles();
  const theme = useTheme();
  const play = useFeedback();
  const burst = useSharedValue(0);
  const travel = useSharedValue(0);
  const size = theme.layout.iconSize;
  const to = group.to ?? group.from;
  const angle = index * SPREAD_ANGLE;
  const radius = theme.space.xxxl + (index % 3) * theme.space.md;
  const offsetX = Math.cos(angle) * radius;
  const offsetY = Math.sin(angle) * radius * 0.6;
  const lift = Math.max(theme.space.giant, Math.abs(to.x - group.from.x) * 0.25);
  const glyph = GLYPHS[group.kind];

  useEffect(() => {
    const land = () => {
      const landing = landGlyph(group.id);
      if (landing && claimLandingCue(landing.index, landing.glyphs, Date.now())) {
        play(group.kind === 'denarii' ? 'coin' : 'tap');
      }
    };
    burst.set(withSpring(1, themeSpring('pop')));
    travel.set(
      withDelay(
        TIMING.hold + index * TIMING.stagger,
        withSequence(
          withTiming(PULL_BACK, { duration: TIMING.pullBack }),
          withSpring(1, SLINGSHOT, (finished) => {
            if (finished) scheduleOnRN(land);
          }),
        ),
      ),
    );
  }, [burst, group.id, group.kind, index, play, travel]);

  const style = useAnimatedStyle(() => {
    const t = travel.get();
    const startX = group.from.x + offsetX * burst.get();
    const startY = group.from.y + offsetY * burst.get();
    const controlX = (startX + to.x) / 2;
    const controlY = Math.min(startY, to.y) - lift;
    const inverse = 1 - t;
    const x = inverse * inverse * startX + 2 * inverse * t * controlX + t * t * to.x;
    const y = inverse * inverse * startY + 2 * inverse * t * controlY + t * t * to.y;
    return {
      opacity: t >= 1 ? 0 : 1,
      transform: [
        { translateX: x - size / 2 },
        { translateY: y - size / 2 },
        { scale: burst.get() * (1 - Math.max(0, t) * 0.4) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.glyph, style]}>
      <Icon name={glyph.icon} size={size} color={glyph.color} strokeWidth={2.2} />
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  glyph: { position: 'absolute', left: 0, top: 0 },
  pop: {
    position: 'absolute',
    left: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xxs,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xxs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceRaised,
    boxShadow: theme.effects.cardShadow,
  },
}));
