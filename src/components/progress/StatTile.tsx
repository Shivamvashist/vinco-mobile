import { View } from 'react-native';

import { type ColorRole, createStyles } from '@/theme';

import { Txt } from '../Txt';

export type StatTileProps = {
  value: string;
  label: string;
  /** Colour of the value: accent for the headline stat. */
  color?: ColorRole;
};

/** A big number over its label, as in Vidi's stat row. Read as one item by screen readers. */
export function StatTile({ value, label, color = 'text' }: StatTileProps) {
  const styles = useStyles();
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${value} ${label}`}>
      <Txt variant="heading" color={color} numberOfLines={1}>
        {value}
      </Txt>
      <Txt variant="micro" numberOfLines={2} style={styles.label}>
        {label}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  tile: {
    flex: 1,
    minWidth: 0,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  label: { marginTop: theme.space.xxs },
}));
