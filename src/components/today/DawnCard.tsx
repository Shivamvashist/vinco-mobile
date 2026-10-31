import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { createStyles, iconTile } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type DawnCardProps = {
  /** The local hour now, for the greeting. */
  hour: number;
  /** The planned wake time, already formatted ("6:30 am"), or null if none. */
  plannedTime: string | null;
  onRise: () => void;
  /** Opens the sick-day sheet. Omitted when there is no arc to protect. */
  onFeelingSick?: () => void;
};

/**
 * The first thing on Today until wake-up is logged: one greeting, one button, and a quiet
 * way out for a sick day. "I'm up" opens the wake sheet; the orders wait below until then.
 * A surface card with first light rising from the bottom, like the hero.
 */
export function DawnCard({ hour, plannedTime, onRise, onFeelingSick }: DawnCardProps) {
  const styles = useStyles();
  const copy = todayCopy.dawn;
  return (
    <Card glow={{ color: 'accent', intensity: 0.7 }} style={styles.card}>
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
        {onFeelingSick ? (
          <Button label={todayCopy.sickDay.dawnAction} variant="ghost" cue="tap" onPress={onFeelingSick} />
        ) : null}
      </View>
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { alignItems: 'center', paddingVertical: theme.space.xxl },
  sun: iconTile(theme, 'accentSoft', 'round'),
  eyebrow: { marginTop: theme.space.md, marginBottom: theme.space.xs },
  planned: { marginTop: theme.space.xs },
  action: { alignSelf: 'stretch', marginTop: theme.space.xl, gap: theme.space.xs },
}));
