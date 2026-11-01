import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { Txt } from '@/components/Txt';
import { reelsCopy } from '@/copy';
import { getReelBadgeStage, type ReelBadgeStage } from '@/features/guard';
import { type ColorRole, createStyles } from '@/theme';

export type ReelTodayCardProps = {
  count: number;
  /** The budget plus today's passes. */
  allowance: number;
  passes: number;
  /** Offer the pass (Vigil and up, near or past the allowance, passes left). */
  canOfferPass: boolean;
  onPass: () => void;
};

const copy = reelsCopy.today;

const STAGE_COLORS: Record<ReelBadgeStage, ColorRole> = {
  calm: 'text',
  near: 'accent',
  over: 'danger',
};

const BAR_COLORS: Record<ReelBadgeStage, ColorRole> = {
  calm: 'textMuted',
  near: 'accent',
  over: 'danger',
};

/**
 * Today at a glance: the count as one big number against the allowance, a thin bar (gold near
 * it, porphyry past it), one line of what is left, the passes if any, and the pass when it helps.
 */
export function ReelTodayCard({ count, allowance, passes, canOfferPass, onPass }: ReelTodayCardProps) {
  const styles = useStyles();
  const stage = getReelBadgeStage(count, allowance);
  const left = allowance - count;
  const status = left > 0 ? copy.left(left) : left === 0 ? copy.atBudget : copy.over(-left);

  return (
    <Card style={styles.card}>
      <View
        style={styles.countRow}
        accessible
        accessibilityRole="text"
        accessibilityLabel={copy.label(count, allowance)}
      >
        <Txt variant="numeral" color={STAGE_COLORS[stage]} numberOfLines={1} style={styles.count}>
          {String(count)}
        </Txt>
        <Txt variant="body" color="textMuted" numberOfLines={1} style={styles.of}>
          {copy.of(allowance)}
        </Txt>
      </View>
      <ProgressBar
        size="thin"
        value={allowance > 0 ? Math.min(1, count / allowance) : 1}
        color={BAR_COLORS[stage]}
      />
      <Txt variant="caption" color={stage === 'over' ? 'danger' : 'textMuted'}>
        {status}
      </Txt>
      {passes > 0 ? <Txt variant="caption">{copy.passes(passes)}</Txt> : null}
      {canOfferPass ? (
        <View style={styles.action}>
          <Button
            label={copy.pass}
            variant="secondary"
            size="compact"
            accessibilityHint={copy.passHint}
            onPress={onPass}
          />
        </View>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { gap: theme.space.sm },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: theme.space.sm },
  count: { flexShrink: 0 },
  of: { flexShrink: 1 },
  action: { marginTop: theme.space.xs },
}));
