import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type DawnCardProps = {
  /** The local hour now, for the greeting. */
  hour: number;
  /** The planned wake time, already formatted ("6:30 am"), or null if none. */
  plannedTime: string | null;
  onRise: () => void;
};

/**
 * The first thing on Today until wake-up is logged: one greeting, one button.
 * "I'm up" opens the wake sheet; the orders wait below until then.
 */
export function DawnCard({ hour, plannedTime, onRise }: DawnCardProps) {
  const styles = useStyles();
  const copy = todayCopy.dawn;
  return (
    <View style={styles.card}>
      <View style={styles.sun}>
        <Icon name="sunrise" color="accent" />
      </View>
      <Txt variant="eyebrow" color="accent" style={styles.eyebrow}>
        {copy.eyebrow}
      </Txt>
      <Txt variant="title" align="center" accessibilityRole="header">
        {copy.greeting(hour)}
      </Txt>
      {plannedTime ? (
        <Txt variant="caption" align="center" style={styles.planned}>
          {copy.planned(plannedTime)}
        </Txt>
      ) : null}
      <View style={styles.action}>
        <Button label={copy.action} cue="tap" onPress={onRise} />
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    alignItems: 'center',
    paddingVertical: theme.space.xxl,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.lg,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
  },
  sun: {
    width: theme.layout.iconTileSize,
    height: theme.layout.iconTileSize,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  eyebrow: { marginTop: theme.space.md, marginBottom: theme.space.xs },
  planned: { marginTop: theme.space.xs },
  action: { alignSelf: 'stretch', marginTop: theme.space.xl },
}));
