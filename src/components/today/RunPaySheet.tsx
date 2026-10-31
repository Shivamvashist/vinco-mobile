import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { type NextStreakReward, STREAK } from '@/features/campaign';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type RunPaySheetProps = {
  visible: boolean;
  onClose: () => void;
  nextReward: NextStreakReward;
  /** Free training has no Truces, so the Truce line is left out. */
  isLudus: boolean;
};

const copy = todayCopy.runSheet;

/** "Stipendium" (run pay): the next reward first, then every step the run pays. */
export function RunPaySheet({ visible, onClose, nextReward, isLudus }: RunPaySheetProps) {
  const styles = useStyles();
  const lines = [
    ...STREAK.weekly.map((step) => copy.weekly(step.dayOfWeek, step.amount)),
    ...(isLudus ? [] : [copy.truce]),
    ...STREAK.milestones.map((step) => copy.milestone(step.day, step.amount)),
  ];
  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <Txt variant="label" color="accent" style={styles.next}>
        {todayCopy.streak.next(nextReward.inDays, nextReward.denarii, nextReward.hasTruce)}
      </Txt>
      <Txt variant="body" color="textMuted">
        {copy.body}
      </Txt>
      <View style={styles.list}>
        {lines.map((line) => (
          <View key={line} style={styles.row}>
            <Icon name="coin" color="currency" />
            <Txt variant="body" style={styles.text}>
              {line}
            </Txt>
          </View>
        ))}
      </View>
      <Button label={copy.close} variant="ghost" cue={null} onPress={onClose} />
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  next: { marginTop: theme.space.md, marginBottom: theme.space.xs },
  list: { marginVertical: theme.space.lg, gap: theme.space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  text: { flex: 1 },
}));
