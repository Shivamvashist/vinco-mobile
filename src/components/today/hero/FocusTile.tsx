import { router, useIsFocused } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { focusCopy } from '@/copy';
import { formatFocusClock, splitFocusClock } from '@/features/focus';
import { useFocus } from '@/hooks/useFocus';
import { useFocusUiStore } from '@/stores';
import { createStyles, useFeedback, useTheme } from '@/theme';

import { Icon } from '../../Icon';
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
  const theme = useTheme();
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
      // The play button in the tile's curved corner: the tile itself takes the tap.
      cornerAction={
        <View style={[styles.play, isRunning && styles.playRunning]}>
          <Icon
            name="play"
            size={theme.layout.iconSizeSmall}
            color={isRunning ? 'accent' : 'onAccent'}
            strokeWidth={2.4}
          />
        </View>
      }
    >
      <View style={styles.figure}>
        {isRunning ? (
          <>
            <RollingNumber value={hoursMinutes} variant="display" fit />
            <Txt variant="caption">{copy.left}</Txt>
          </>
        ) : (
          <RollingNumber value={copy.ready} variant="display" fit />
        )}
      </View>
    </HeroTile>
  );
}

const useStyles = createStyles((theme) => ({
  figure: { marginTop: theme.space.sm },
  play: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    boxShadow: theme.effects.cardShadow,
  },
  // While a focus runs the tile shows the time; the button steps back to an outline.
  playRunning: {
    backgroundColor: theme.colors.accentTint,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
  },
}));
