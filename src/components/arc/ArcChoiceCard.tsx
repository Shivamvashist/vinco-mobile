import { View } from 'react-native';

import { arcCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { Txt } from '../Txt';

/** ludus: training now. finished: a campaign reached its last day. active: a campaign runs. */
export type ArcChoiceState = 'ludus' | 'finished' | 'active';

export type ArcChoiceCardProps = {
  state: ArcChoiceState;
  onBeginCampaign: () => void;
  onTrainInLudus: () => void;
};

const copy = arcCopy.choice;

/**
 * Where the journey goes next. In the Ludus: begin a campaign. After a campaign: another, or
 * the Ludus. During a campaign: only a quiet way to the Ludus, so it never tempts a quit.
 */
export function ArcChoiceCard({ state, onBeginCampaign, onTrainInLudus }: ArcChoiceCardProps) {
  const styles = useStyles();
  if (state === 'active') {
    return (
      <Button label={copy.leaveForLudus} variant="ghost" size="compact" cue={null} onPress={onTrainInLudus} />
    );
  }
  const isFinished = state === 'finished';
  return (
    <Card bordered style={styles.card}>
      <Txt variant="heading" accessibilityRole="header">
        {isFinished ? copy.finishedTitle : copy.ludusTitle}
      </Txt>
      <Txt variant="body" color="textMuted">
        {isFinished ? copy.finishedBody : copy.ludusBody}
      </Txt>
      <View style={styles.actions}>
        <Button label={isFinished ? copy.another : copy.begin} cue={null} onPress={onBeginCampaign} />
        {isFinished ? (
          <Button label={copy.toLudus} variant="secondary" cue={null} onPress={onTrainInLudus} />
        ) : null}
      </View>
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { gap: theme.space.sm },
  actions: { marginTop: theme.space.sm, gap: theme.space.xs },
}));
