import { Pressable, View } from 'react-native';

import { createStyles, useFeedback, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

export type StatChipProps = {
  label: string;
  icon?: IconName;
  /** `muted` for secondary facts like "Truce ready"; `currency` for denarii (silver). */
  emphasis?: 'default' | 'muted' | 'currency';
  /** Makes the chip a button (the purse opens the Forum). */
  onPress?: () => void;
  accessibilityHint?: string;
};

/** The chip is 30 tall; this brings its touch area to 44. */
const HIT_SLOP = 7;

/** A small fact pill on Today: "Campaign 11", "Truce ready", "Optio", or the purse. */
export function StatChip({ label, icon, emphasis = 'default', onPress, accessibilityHint }: StatChipProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const iconColor = emphasis === 'currency' ? 'currency' : 'accent';
  const textColor = emphasis === 'muted' ? 'textMuted' : emphasis === 'currency' ? 'currency' : 'text';
  const content = (
    <>
      {icon ? <Icon name={icon} size={theme.layout.iconSizeSmall} color={iconColor} strokeWidth={2} /> : null}
      <Txt variant="caption" color={textColor} numberOfLines={1}>
        {label}
      </Txt>
    </>
  );
  if (!onPress) {
    return (
      <View style={styles.chip} accessible accessibilityLabel={label}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={HIT_SLOP}
      onPress={() => {
        play('tap');
        onPress();
      }}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
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
  pressed: { backgroundColor: theme.colors.surfaceRaised },
}));
