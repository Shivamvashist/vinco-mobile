import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Laurel } from '@/components/Laurel';
import { Txt } from '@/components/Txt';
import { focusCopy, pickTone } from '@/copy';
import type { FocusSessionRow } from '@/db';
import { getFocusOutcome } from '@/features/focus';
import type { Tone } from '@/features/tone';
import { createStyles, themeSpring, useFeedback, useReduceMotion, useTheme } from '@/theme';

export type FocusCompleteProps = {
  /** A finished session: completed (paid or not) or given up. */
  session: FocusSessionRow;
  tone: Tone;
  /** Springs the view back into the CTA. */
  onDone: () => void;
};

/** How small the laurel starts before it pops in. */
const LAUREL_FROM = 0.4;

/**
 * The end of a focus. Held: the laurel pops in on the `pop` spring with the denarii (or the plain
 * reason it paid nothing). Given up: a neutral line that it pays nothing, in every tone.
 */
export function FocusComplete({ session, tone, onDone }: FocusCompleteProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const play = useFeedback();
  const reduceMotion = useReduceMotion();
  const outcome = getFocusOutcome(session);
  const isHeld = outcome !== 'retreated';
  const pop = useSharedValue(reduceMotion || !isHeld ? 1 : 0);

  useEffect(() => {
    if (outcome === 'paid') play('win');
    else if (outcome === 'tooShort' || outcome === 'dailyLimit') play('confirm');
    if (!reduceMotion && outcome !== 'retreated') pop.value = withSpring(1, themeSpring('pop'));
    // Once, when this session's result first shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const laurelStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 1.5),
    transform: [{ scale: LAUREL_FROM + (1 - LAUREL_FROM) * pop.value }],
  }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + theme.space.xl }]}>
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
            {outcome === 'paid' ? (
              <Txt variant="display" color="currency" style={styles.tabular}>
                {focusCopy.complete.earned(session.reward)}
              </Txt>
            ) : (
              <Txt variant="body" color="textMuted" align="center">
                {outcome === 'tooShort' ? focusCopy.complete.tooShort : focusCopy.complete.dailyLimit}
              </Txt>
            )}
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
        <Button
          label={focusCopy.complete.done}
          onPress={onDone}
          variant={isHeld ? 'primary' : 'secondary'}
          cue={null}
        />
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  screen: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.layout.flowGutter,
  },
  tabular: { fontVariant: ['tabular-nums'] },
  line: { marginTop: theme.space.sm },
  footer: { paddingHorizontal: theme.layout.flowGutter },
}));
