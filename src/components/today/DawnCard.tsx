import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { cardSurface, createStyles, useTheme } from '@/theme';

import { Button } from '../Button';
import { Glow } from '../Glow';
import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type DawnCardProps = {
  /** The local hour now, for the greeting. */
  hour: number;
  /** The planned wake time, already formatted ("6:30 am"), or null if none. */
  plannedTime: string | null;
  onRise: () => void;
  /** Opens the sick-day sheet. Omitted when there is no campaign to protect. */
  onFeelingSick?: () => void;
};

/**
 * The hero's first face, until wake-up is logged: the same size and shape as the Dies card, so
 * the swap reads as one card turning over. The planned time in a pill, one greeting, one button,
 * and a quiet way out for a sick day. "I'm up" opens the wake sheet.
 */
export function DawnCard({ hour, plannedTime, onRise, onFeelingSick }: DawnCardProps) {
  const theme = useTheme();
  const styles = useStyles();
  const copy = todayCopy.dawn;
  return (
    <View style={styles.card}>
      <Glow color="accent" intensity={0.7} />
      <View style={styles.top}>
        {plannedTime ? (
          <View style={styles.pill} accessible accessibilityLabel={copy.planned(plannedTime)}>
            <Icon name="sunrise" size={theme.layout.iconSizeSmall} color="accent" />
            <Txt variant="micro" color="textMuted">
              {plannedTime}
            </Txt>
          </View>
        ) : null}
      </View>
      <Txt variant="title" align="center" accessibilityRole="header">
        {copy.greeting(hour)}
      </Txt>
      <View style={styles.actions}>
        <Button label={copy.action} cue="tap" onPress={onRise} />
        {onFeelingSick ? (
          <Button
            label={todayCopy.sickDay.dawnAction}
            variant="ghost"
            size="compact"
            cue="tap"
            onPress={onFeelingSick}
          />
        ) : null}
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    minHeight: theme.layout.heroCardHeight,
    padding: theme.layout.cardPadding,
    ...cardSurface(theme),
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
  top: { flexDirection: 'row', alignItems: 'center', minHeight: theme.layout.minTouchTarget },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xxs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
  actions: { gap: theme.space.xxs },
}));
