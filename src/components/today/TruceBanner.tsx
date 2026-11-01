import { View } from 'react-native';

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
 * While a Truce can still save the campaign (until today ends), one compact line on Today: what
 * happened and the way to the options. A porphyry glow, so it reads on every palette. Screen
 * readers get the full sentence.
 */
export function TruceBanner({ campaign, missedDays, onOpen }: TruceBannerProps) {
  const styles = useStyles();
  const copy = todayCopy.truceBanner;
  return (
    <Card glow={{ color: 'danger', origin: 'bottomLeft', intensity: 0.8 }} style={styles.card}>
      <View
        style={styles.text}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${copy.title}. ${copy.detail(campaign, missedDays)}`}
      >
        <Txt variant="label" color="danger" numberOfLines={2}>
          {copy.title}
        </Txt>
      </View>
      <Button label={copy.action} variant="secondary" size="compact" onPress={onOpen} />
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.space.sm,
    padding: theme.layout.cardPadding,
  },
  text: { flex: 1, minWidth: theme.space.giant * 2 },
}));
