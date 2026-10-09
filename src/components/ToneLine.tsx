import { commonCopy } from '@/copy';
import type { Tone } from '@/features/tone';
import { createStyles } from '@/theme';

import { Card } from './Card';
import { Txt } from './Txt';

export type ToneLineProps = {
  /** The line, already picked for the tone. */
  line: string;
  tone: Tone;
};

/**
 * A message from Vinco in the user's tone, with the tone named underneath.
 * Used for empty states and the progress line on Today.
 */
export function ToneLine({ line, tone }: ToneLineProps) {
  const styles = useStyles();
  return (
    <Card accessibilityRole="text">
      <Txt variant="body">{line}</Txt>
      <Txt variant="micro" style={styles.label}>
        {commonCopy.toneLabel(commonCopy.toneNames[tone])}
      </Txt>
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  label: { marginTop: theme.space.xs },
}));
