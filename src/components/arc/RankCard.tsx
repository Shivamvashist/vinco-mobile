import { View } from 'react-native';

import { arcCopy } from '@/copy';
import type { RankStatus } from '@/features/campaign';
import { createStyles } from '@/theme';

import { Card } from '../Card';
import { ProgressBar } from '../ProgressBar';
import { Txt } from '../Txt';

export type RankCardProps = {
  rank: RankStatus;
  denarii: number;
};

const MEDALLION_SIZE = 56;
const copy = arcCopy.rank;

/** The current rank: medallion, name, what it means, days to the next, and denarii earned. */
export function RankCard({ rank, denarii }: RankCardProps) {
  const styles = useStyles();
  const { current, next } = rank;
  const medallionName = current?.name ?? next?.name ?? '';
  const detail = !current
    ? copy.noneDetail
    : next
      ? copy.next(current.meaning, next.name, rank.daysToNext)
      : copy.top(current.meaning);

  return (
    <Card style={styles.card}>
      <View style={[styles.medallion, !current && styles.medallionLocked]}>
        <Txt variant="heading" color={current ? 'accent' : 'textFaint'}>
          {medallionName.slice(0, 2)}
        </Txt>
      </View>
      <View style={styles.text}>
        <Txt variant="heading" accessibilityRole="header">
          {current?.name ?? copy.noneTitle}
        </Txt>
        <Txt variant="caption" style={styles.detail}>
          {detail}
        </Txt>
        {next ? (
          <View style={styles.progress}>
            <ProgressBar value={rank.progress} accessibilityLabel={copy.progressLabel} />
          </View>
        ) : null}
        <Txt variant="micro" color="currency" style={styles.denarii}>
          {copy.denarii(denarii)}
        </Txt>
      </View>
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { flexDirection: 'row', alignItems: 'center', gap: theme.layout.cardPadding },
  medallion: {
    width: MEDALLION_SIZE,
    height: MEDALLION_SIZE,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionLocked: { borderColor: theme.colors.borderStrong, borderStyle: 'dashed' },
  text: { flex: 1, minWidth: 0 },
  detail: { marginTop: theme.space.xxs },
  progress: { marginTop: theme.space.sm },
  denarii: { marginTop: theme.space.sm },
}));
