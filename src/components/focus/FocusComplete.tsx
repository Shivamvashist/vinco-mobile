import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { type FlightPoint, measureCentre } from '@/components/hud';
import { HudCounters } from '@/components/hud/HudCounters';
import { Laurel } from '@/components/Laurel';
import { Txt } from '@/components/Txt';
import { focusCopy, pickTone } from '@/copy';
import type { FocusSessionRow } from '@/db';
import { getFocusOutcome, heldMinutes } from '@/features/focus';
import { focusGloria } from '@/features/gloria';
import type { Tone } from '@/features/tone';
import { createStyles, themeSpring, useFeedback, useReduceMotion, useTheme } from '@/theme';

export type FocusCompleteProps = {
  /** A finished session: completed (paid or not) or given up. */
  session: FocusSessionRow;
  tone: Tone;
  /**
   * The reward was revealed. The ledger row was written when the focus completed, so this is only
   * the show: the screen launches the reward flight from `origin` (the Claim button's centre) to
   * the counters at the top of this view.
   */
  onClaim?: (origin: FlightPoint, rewards: { denarii: number; gloria: number }) => void;
  /** Leaves the result (back to Today). */
  onDone: () => void;
};

/** How small the laurel starts before it pops in. */
const LAUREL_FROM = 0.4;

/**
 * The end of a focus. Held: the laurel pops in with the minutes, then "Claim" reveals what it paid
 * (denarii, already in the ledger, and glory points), and the counters fade in at the top so the
 * rewards have somewhere to fly (they hold back the reward until it lands). Given up: a neutral
 * line that it pays nothing, in every tone.
 */
export function FocusComplete({ session, tone, onClaim, onDone }: FocusCompleteProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const play = useFeedback();
  const reduceMotion = useReduceMotion();
  const claimRef = useRef<View>(null);
  const [isClaimed, setIsClaimed] = useState(false);
  // The counters hold back the reward until the flight takes over (or there is none to fly).
  const [isLaunched, setIsLaunched] = useState(false);
  const outcome = getFocusOutcome(session);
  const isHeld = outcome !== 'retreated';
  const gloria = focusGloria(heldMinutes(session));
  const rewards = { denarii: Math.max(0, session.reward), gloria };
  const pop = useSharedValue(reduceMotion || !isHeld ? 1 : 0);
  const reveal = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (isHeld) play('focusHeld');
    if (!reduceMotion && isHeld) pop.set(withSpring(1, themeSpring('pop')));
    // Once, when this session's result first shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const laurelStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.get() * 1.5),
    transform: [{ scale: LAUREL_FROM + (1 - LAUREL_FROM) * pop.get() }],
  }));
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.get(),
    transform: [{ translateY: (1 - reveal.get()) * theme.space.lg }],
  }));
  const hudStyle = useAnimatedStyle(() => ({ opacity: reveal.get() }));

  const handleClaim = () => {
    if (isClaimed) return;
    setIsClaimed(true);
    play('coin');
    reveal.set(reduceMotion ? 1 : withSpring(1, themeSpring('pop')));
    // Measured before the button gives way to Done.
    measureCentre(claimRef.current, (origin) => {
      setIsLaunched(true);
      if (origin) onClaim?.(origin, rewards);
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + theme.space.xl }]}>
      {isHeld ? (
        <Animated.View
          style={[styles.hud, hudStyle]}
          pointerEvents={isClaimed ? 'auto' : 'none'}
          importantForAccessibility={isClaimed ? 'auto' : 'no-hide-descendants'}
          accessibilityElementsHidden={!isClaimed}
        >
          <HudCounters held={isLaunched ? undefined : rewards} />
        </Animated.View>
      ) : null}
      <View style={styles.body} accessible accessibilityLiveRegion="polite">
        {isHeld ? (
          <>
            <Animated.View style={laurelStyle}>
              <Laurel width={theme.space.giant * 3} strokeWidth={1.6} />
            </Animated.View>
            <Txt variant="eyebrow">{focusCopy.complete.minutesHeld(session.minutes)}</Txt>
            <Txt variant="title" align="center" accessibilityRole="header">
              {focusCopy.complete.title}
            </Txt>
            {isClaimed ? (
              <Animated.View style={[styles.reward, revealStyle]}>
                {outcome === 'paid' ? (
                  <Txt variant="display" color="currency" style={styles.tabular}>
                    {focusCopy.complete.earned(session.reward)}
                  </Txt>
                ) : (
                  <Txt variant="body" color="textMuted" align="center">
                    {outcome === 'tooShort' ? focusCopy.complete.tooShort : focusCopy.complete.dailyLimit}
                  </Txt>
                )}
                <Txt variant="label" color="accent" style={styles.tabular}>
                  {focusCopy.complete.gloria(gloria)}
                </Txt>
              </Animated.View>
            ) : null}
            <Txt variant="body" color="textMuted" align="center" style={styles.line}>
              {pickTone(focusCopy.complete.line, tone)}
            </Txt>
          </>
        ) : (
          <>
            <Txt variant="title" align="center" accessibilityRole="header">
              {focusCopy.complete.retreatTitle}
            </Txt>
            <Txt variant="body" color="textMuted" align="center">
              {focusCopy.complete.retreatBody}
            </Txt>
          </>
        )}
      </View>
      <View style={styles.footer}>
        {isHeld && !isClaimed ? (
          <View ref={claimRef} collapsable={false}>
            <Button
              label={focusCopy.complete.claim}
              accessibilityLabel={focusCopy.complete.claimLabel(session.reward, gloria)}
              onPress={handleClaim}
              size="regular"
              cue={null}
            />
          </View>
        ) : (
          <Button
            label={focusCopy.complete.done}
            onPress={onDone}
            variant={isHeld ? 'primary' : 'secondary'}
            cue={null}
          />
        )}
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  screen: { flex: 1 },
  hud: {
    alignSelf: 'flex-end',
    minHeight: theme.layout.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: theme.layout.screenGutter,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.layout.flowGutter,
  },
  reward: { alignItems: 'center', gap: theme.space.xs },
  tabular: { fontVariant: ['tabular-nums'] },
  line: { marginTop: theme.space.sm },
  footer: { paddingHorizontal: theme.layout.flowGutter },
}));
