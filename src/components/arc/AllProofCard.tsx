import { View } from 'react-native';

import { proofCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type AllProofCardProps = {
  /** Every selfie ever taken, across arcs. */
  frames: number;
  /** "9 October 2026": the first selfie's date. */
  since: string | null;
  onPlay: () => void;
};

/** Vici: the whole journey, every arc, from the first selfie to the latest. */
export function AllProofCard({ frames, since, onPlay }: AllProofCardProps) {
  const styles = useStyles();
  const copy = proofCopy.reel.allCard;
  return (
    <Card>
      <View style={styles.heading}>
        <Icon name="camera" color="accent" />
        <Txt variant="label">{copy.title}</Txt>
      </View>
      <Txt variant="caption" style={styles.detail}>
        {frames > 0 && since ? copy.detail(frames, since) : copy.empty}
      </Txt>
      {frames >= 2 ? (
        <View style={styles.action}>
          <Button label={copy.play} variant="secondary" size="compact" onPress={onPlay} />
        </View>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  heading: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  detail: { marginTop: theme.space.xs },
  action: { marginTop: theme.space.md },
}));
