import { View } from 'react-native';

import { guardCopy } from '@/copy';
import { getReelBadgeStage, type ReelBadgeStage } from '@/features/guard';
import { type ColorRole, createStyles } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { Txt } from '../Txt';

export type ReelCountCardProps = {
  count: number;
  budget: number;
  /** Null when nothing was kept for yesterday. */
  yesterday: number | null;
  /** The apps counted, by name. */
  appNames: readonly string[];
  /** The guard service: on, off, or null while it is being read. */
  isServiceOn: boolean | null;
  /** Opens the accessibility settings (this card is the disclosure before it). */
  onTurnOn: () => void;
};

const copy = guardCopy.reels;

const STAGE_COLORS: Record<ReelBadgeStage, ColorRole> = {
  calm: 'text',
  near: 'accent',
  over: 'danger',
};

/**
 * Today's reels against the budget (the guard screen). The number takes the badge's colours:
 * marble, gold from 80% of the budget, porphyry past it. With the guard service off, the card
 * says plainly what the counter reads before offering to open the settings (Play's prominent
 * disclosure); counts already kept stay.
 */
export function ReelCountCard({
  count,
  budget,
  yesterday,
  appNames,
  isServiceOn,
  onTurnOn,
}: ReelCountCardProps) {
  const styles = useStyles();
  const stage = getReelBadgeStage(count, budget);

  return (
    <Card style={styles.card}>
      <View accessible accessibilityRole="text" accessibilityLabel={copy.countLabel(count, budget)}>
        <Txt
          variant="display"
          color={STAGE_COLORS[stage]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {copy.count(count, budget)}
        </Txt>
      </View>
      <Txt variant="caption">{yesterday == null ? copy.noYesterday : copy.yesterday(yesterday)}</Txt>
      <Txt variant="caption">{copy.apps(appNames)}</Txt>
      {isServiceOn === false ? (
        <View style={styles.off}>
          <Txt variant="label" accessibilityRole="header">
            {copy.offTitle}
          </Txt>
          <Txt variant="body" color="textMuted">
            {copy.offBody}
          </Txt>
          <Txt variant="caption">{copy.offKept}</Txt>
          <Button
            label={copy.turnOn}
            accessibilityHint={copy.turnOnHint}
            onPress={onTurnOn}
            variant="secondary"
            size="compact"
          />
        </View>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { gap: theme.space.xs },
  off: {
    gap: theme.space.sm,
    marginTop: theme.space.md,
    paddingTop: theme.space.md,
    borderTopWidth: theme.layout.hairline,
    borderTopColor: theme.colors.border,
  },
}));
