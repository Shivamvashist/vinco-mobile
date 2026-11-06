import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { auroraSetupCopy, pickTone } from '@/copy';
import { useEntrance } from '@/hooks/useEntrance';
import { usePreferencesStore } from '@/stores';
import { createStyles, useTheme } from '@/theme';

import { Button } from '../Button';
import { Glow } from '../Glow';
import { Icon } from '../Icon';
import { Screen } from '../Screen';
import { Txt } from '../Txt';

const copy = auroraSetupCopy.done;
/** The emblem grows to full size from this share as it lands. */
const EMBLEM_FROM = 0.8;

export type AuroraSetupDoneProps = {
  /** The first ring in words ("Tomorrow, 6:30 am"), or null when no day is chosen. */
  firstRing: string | null;
  onDone: () => void;
};

/**
 * The end of the setup flow: the alarm emblem lands in a gold glow, "Aurora is set", one line in
 * the user's tone and the first ring. Only the emblem's size moves; it is always fully visible.
 */
export function AuroraSetupDone({ firstRing, onDone }: AuroraSetupDoneProps) {
  const theme = useTheme();
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);
  const enter = useEntrance();
  const emblemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: EMBLEM_FROM + (1 - EMBLEM_FROM) * enter.get() }],
  }));

  return (
    <Screen scroll={false} gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.centre}>
        <Animated.View style={[styles.emblem, emblemStyle]}>
          <Glow color="accent" intensity={0.9} />
          <Icon name="alarm" size={theme.layout.iconSize * 2} color="accent" strokeWidth={2} />
        </Animated.View>
        <Txt variant="title" align="center" accessibilityRole="header">
          {copy.title}
        </Txt>
        <Txt variant="body" color="textMuted" align="center">
          {pickTone(copy.line, tone)}
        </Txt>
        {firstRing ? (
          <Txt variant="label" color="accent" align="center">
            {copy.firstRing(firstRing)}
          </Txt>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button label={copy.toToday} onPress={onDone} />
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.space.md },
  emblem: {
    width: theme.layout.heroCardHeight / 2,
    height: theme.layout.heroCardHeight / 2,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    marginBottom: theme.space.md,
  },
  footer: { paddingTop: theme.space.md },
}));
