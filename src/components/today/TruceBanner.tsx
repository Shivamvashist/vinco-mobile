import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Txt } from '../Txt';

export type TruceBannerProps = {
  /** The campaign a Truce would save. */
  campaign: number;
  /** How many missed days the Truce must cover. */
  missedDays: number;
  onOpen: () => void;
};

/** While a Truce can still save the campaign (until today ends), Today says so. */
export function TruceBanner({ campaign, missedDays, onOpen }: TruceBannerProps) {
  const styles = useStyles();
  const copy = todayCopy.truceBanner;
  return (
    <View style={styles.card} accessibilityRole="summary">
      <Txt variant="label" color="danger" accessibilityRole="header">
        {copy.title}
      </Txt>
      <Txt variant="caption" style={styles.detail}>
        {copy.detail(campaign, missedDays)}
      </Txt>
      <Button label={copy.action} variant="secondary" size="compact" onPress={onOpen} />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.dangerBorder,
    backgroundColor: theme.colors.dangerSoft,
  },
  detail: { marginTop: theme.space.xs, marginBottom: theme.space.md },
}));
