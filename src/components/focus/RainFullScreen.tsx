import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { BackHandler, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import { focusCopy } from '@/copy';
import { useEntrance } from '@/hooks/useEntrance';
import { createStyles, useTheme } from '@/theme';

import { FocusClock } from './FocusClock';
import { RainField } from './RainField';
import { RainSoundToggle } from './RainSoundToggle';

export type RainFullScreenProps = {
  remainingMs: number;
  isSoundOn: boolean;
  onToggleSound: () => void;
  /** Back to the normal focus screen (the corners button, or Back). */
  onExit: () => void;
};

/**
 * "h:mm" with its seconds is about 2.7 font sizes wide (FocusClock): sized to this many, so it
 * always fits the width with room to spare, and never taller than a share of the window.
 */
const CLOCK_EMS = 3;
const CLOCK_WIDTH_SHARE = 0.84;
const CLOCK_HEIGHT_SHARE = 0.16;

/**
 * The full-screen rain on the running focus: an overlay on the focus screen (not a route), so the
 * timer, the guard and the end of the focus carry on underneath it. The rain fills the screen, the
 * time left sits large and quiet in the middle, the status bar hides and the window dims (the
 * caller's useFocusDim). Back or the corners button returns to the focus screen; under Silentium
 * Back still only leaves the full screen (this listener runs before the lock's).
 */
export function RainFullScreen({ remainingMs, isSoundOn, onToggleSound, onExit }: RainFullScreenProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const enter = useEntrance();
  const fontSize = Math.floor(
    Math.min((window.width * CLOCK_WIDTH_SHARE) / CLOCK_EMS, window.height * CLOCK_HEIGHT_SHARE),
  );

  // Added after the focus lock's listener (Back listeners are asked newest first), so it wins.
  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onExit();
      return true;
    });
    return () => back.remove();
  }, [onExit]);

  const style = useAnimatedStyle(() => ({ opacity: enter.get() }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.screen, style]} accessibilityViewIsModal>
      <StatusBar hidden style={theme.statusBarStyle} />
      <View style={StyleSheet.absoluteFill}>
        <RainField variant="full" />
      </View>
      <View style={[StyleSheet.absoluteFill, styles.centre]} pointerEvents="none">
        <FocusClock remainingMs={remainingMs} fontSize={fontSize} />
      </View>
      <View
        style={[styles.bar, { top: insets.top + theme.space.sm, left: insets.left, right: insets.right }]}
        pointerEvents="box-none"
      >
        <IconButton
          icon="collapse"
          accessibilityLabel={focusCopy.active.rainExit}
          onPress={onExit}
          color="textMuted"
          cue="tap"
        />
        <RainSoundToggle isSoundOn={isSoundOn} onToggle={onToggleSound} />
      </View>
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  screen: { backgroundColor: theme.colors.background },
  centre: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.layout.flowGutter },
  bar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.sm,
  },
}));
