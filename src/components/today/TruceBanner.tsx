import { todayCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { Txt } from '../Txt';

export type TruceBannerProps = {
  /** The campaign a Truce would save. */
  campaign: number;
  /** How many missed days the Truce must cover. */
  missedDays: number;
  onOpen: () => void;
};

/**
 * While a Truce can still save the campaign (until today ends), Today says so: a surface card
 * with a porphyry glow, so the warning reads on every palette without a flat red box.
 */
export function TruceBanner({ campaign, missedDays, onOpen }: TruceBannerProps) {
  const styles = useStyles();
  const copy = todayCopy.truceBanner;
  return (
    <Card
      glow={{ color: 'danger', origin: 'bottomLeft', intensity: 0.8 }}
      style={styles.card}
      accessibilityRole="summary"
    >
      <Txt variant="label" color="danger" accessibilityRole="header">
        {copy.title}
      </Txt>
      <Txt variant="caption" style={styles.detail}>
        {copy.detail(campaign, missedDays)}
      </Txt>
      <Button label={copy.action} variant="secondary" size="compact" onPress={onOpen} />
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { padding: theme.layout.cardPadding },
  detail: { marginTop: theme.space.xs, marginBottom: theme.space.md },
}));
