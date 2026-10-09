import { View } from 'react-native';

import { createStyles, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

export type StatChipProps = {
  label: string;
  icon?: IconName;
  /** `muted` for secondary facts like "Truce ready". */
  emphasis?: 'default' | 'muted';
};

/** A small fact pill on Today: "Campaign 11", "Truce ready", "Optio". Not pressable. */
export function StatChip({ label, icon, emphasis = 'default' }: StatChipProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.chip} accessible accessibilityLabel={label}>
      {icon ? <Icon name={icon} size={theme.layout.iconSizeSmall} color="accent" strokeWidth={2} /> : null}
      <Txt variant="caption" color={emphasis === 'muted' ? 'textMuted' : 'text'} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    minHeight: theme.layout.chipHeight,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
  },
}));
