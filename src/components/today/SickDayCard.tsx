import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { Txt } from '../Txt';

export type SickDayCardProps = {
  onFeelingBetter: () => void;
};

const copy = todayCopy.sickDay;

/** Replaces the dawn card on a sick day: calm, neutral, and the way back if you recover. */
export function SickDayCard({ onFeelingBetter }: SickDayCardProps) {
  const styles = useStyles();
  return (
    <Card glow={{ color: 'rest', intensity: 0.4 }} style={styles.card}>
      <Txt variant="eyebrow" color="textMuted">
        {copy.cardEyebrow}
      </Txt>
      <Txt variant="heading" accessibilityRole="header" style={styles.title}>
        {copy.cardTitle}
      </Txt>
      <Txt variant="body" color="textMuted" style={styles.body}>
        {copy.cardBody}
      </Txt>
      <View style={styles.action}>
        <Button
          label={copy.better}
          variant="secondary"
          size="compact"
          cue="stepDown"
          accessibilityHint={copy.betterHint}
          onPress={onFeelingBetter}
        />
      </View>
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { padding: theme.layout.cardPadding },
  title: { marginTop: theme.space.xs },
  body: { marginTop: theme.space.xs },
  action: { marginTop: theme.space.lg },
}));
