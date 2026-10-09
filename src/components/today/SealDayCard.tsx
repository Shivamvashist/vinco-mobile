import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type SealDayCardProps = {
  /** Whether every order hit its full goal, or the line was held at the minimum. */
  status: 'held' | 'conquered';
  onSeal: () => void;
};

/**
 * Stays on Today once all four orders hold, so the day card is always one tap away,
 * even after the stamp was dismissed.
 */
export function SealDayCard({ status, onSeal }: SealDayCardProps) {
  const styles = useStyles();
  const copy = todayCopy.sealCard;
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Icon name="check" color="accent" />
        <Txt variant="label" color="accent" accessibilityRole="header">
          {status === 'conquered' ? copy.conqueredTitle : copy.heldTitle}
        </Txt>
      </View>
      <Txt variant="caption" style={styles.detail}>
        {copy.detail}
      </Txt>
      <Button label={copy.action} size="compact" cue="confirm" onPress={onSeal} />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  detail: { marginTop: theme.space.xs, marginBottom: theme.space.md },
}));
