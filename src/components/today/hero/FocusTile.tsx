import { router, useIsFocused } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { focusCopy } from '@/copy';
import { formatFocusClock, splitFocusClock } from '@/features/focus';
import { useFocus } from '@/hooks/useFocus';
import { useFocusUiStore } from '@/stores';
import { createStyles, useFeedback } from '@/theme';

import { RollingNumber } from '../../RollingNumber';
import { Txt } from '../../Txt';
import { HeroTile } from './HeroTile';

const copy = focusCopy.tile;

/**
 * The Focus tile on Today: "Ready", or the time left (live) while a focus runs. Tapping it opens
 * the focus screen. It also reopens that screen by itself: once per app start when a focus is
 * running (the app was closed mid-focus), and once when a focus finished, to show its result.
 */
export function FocusTile() {
  const styles = useStyles();
  const play = useFeedback();
  const focus = useFocus();
  const isScreenFocused = useIsFocused();
  const hasResumed = useFocusUiStore((state) => state.hasResumed);
  const markResumed = useFocusUiStore((state) => state.markResumed);
  // The finished focus this tile already opened the screen for.
  const openedForId = useRef<number | null>(null);
  const isRunning = focus.running != null;
  const settledId = focus.settled?.id ?? null;
  const { hoursMinutes } = splitFocusClock(focus.remainingMs);

  useEffect(() => {
    if (!focus.isLoaded || !isScreenFocused) return;
    if (!hasResumed) {
      markResumed();
      if (isRunning) {
        router.push('/focus');
        return;
      }
    }
    if (settledId != null && openedForId.current !== settledId) {
      openedForId.current = settledId;
      router.push('/focus');
    }
  }, [focus.isLoaded, isScreenFocused, hasResumed, isRunning, settledId, markResumed]);

  return (
    <HeroTile
      icon="shield"
      title={copy.title}
      glow="accent"
      glowOrigin="bottomRight"
      isLit={isRunning}
      onPress={() => {
        play('tap');
        router.push('/focus');
      }}
      accessibilityLabel={isRunning ? copy.runningLabel(formatFocusClock(focus.remainingMs)) : copy.label}
      accessibilityHint={copy.hint}
    >
      <View style={styles.figure}>
        {isRunning ? (
          <>
            <RollingNumber value={hoursMinutes} variant="display" />
            <Txt variant="caption">{copy.left}</Txt>
          </>
        ) : (
          <Txt variant="display" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {copy.ready}
          </Txt>
        )}
      </View>
      <Txt variant="caption" color={isRunning ? 'accent' : 'textMuted'} numberOfLines={1}>
        {copy.readyCaption}
      </Txt>
    </HeroTile>
  );
}

const useStyles = createStyles((theme) => ({
  figure: { marginTop: theme.space.sm },
}));
