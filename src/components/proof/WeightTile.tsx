import { Pressable, View } from 'react-native';

import { commonCopy, proofCopy } from '@/copy';
import type { DayKey } from '@/lib/dates';
import { createStyles, useTheme } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type WeightTileProps = {
  today: DayKey;
  todayKg: number | null;
  /** The most recent weight before or on today, for "Last: 72.5 kg". */
  latest: { day: DayKey; kg: number } | null;
  onPress: () => void;
};

/** Body weight on Today: a clear call to log it, or today's number once logged. */
export function WeightTile({ today, todayKg, latest, onPress }: WeightTileProps) {
  const theme = useTheme();
  const styles = useStyles();
  const copy = proofCopy.weightTile;
  const isLogged = todayKg != null;
  const status = isLogged
    ? copy.today(proofCopy.kg(todayKg))
    : latest
      ? copy.last(proofCopy.kg(latest.kg), commonCopy.dayLabel(latest.day, today))
      : copy.notLogged;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}, ${status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, !isLogged && styles.call, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon name={isLogged ? 'check' : 'scale'} color="accent" />
      </View>
      <View style={styles.text}>
        <Txt variant="label">{copy.title}</Txt>
        <Txt variant="caption" color={isLogged ? 'accent' : 'textMuted'}>
          {status}
        </Txt>
      </View>
      <Icon name="forward" size={theme.layout.iconSizeSmall} color="textMuted" />
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.layout.cardPadding,
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: 'transparent',
    backgroundColor: theme.colors.surface,
  },
  call: { borderColor: theme.colors.accentBorder },
  pressed: { opacity: 0.85 },
  icon: {
    width: theme.layout.iconTileSize,
    height: theme.layout.iconTileSize,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  text: { flex: 1, minWidth: 0 },
}));
