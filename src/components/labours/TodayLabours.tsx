import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { pickTone, rewardsCopy } from '@/copy';
import { resolveClaimPay } from '@/features/labours';
import { useLabours } from '@/hooks/useLabours';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { Txt } from '../Txt';

import { LabourRow } from './LabourRow';

const copy = rewardsCopy.labours;

/**
 * Today's Labours card: the top three (claimable first, then the closest to done) with their
 * progress and pay, and "See all" for the full board. Reads the board itself, so Today adds it
 * with one line. A claim flies its rewards to the HUD counters.
 */
export function TodayLabours() {
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);
  const labours = useLabours();
  const [problem, setProblem] = useState<string | null>(null);

  if (!labours.isLoaded) return null;

  return (
    <Card bordered style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Txt variant="overline" accessibilityRole="header">
            {copy.title}
          </Txt>
          <Txt variant="micro">{copy.latin}</Txt>
        </View>
        <Button
          label={copy.seeAll}
          accessibilityLabel={copy.seeAllLabel}
          variant="ghost"
          size="compact"
          onPress={() => router.push('/labours')}
        />
      </View>
      {labours.top.length === 0 ? (
        <Txt variant="body" color="textMuted">
          {pickTone(copy.allDone, tone)}
        </Txt>
      ) : (
        labours.top.map((status) => (
          <LabourRow
            key={status.labour.id}
            status={status}
            pay={resolveClaimPay(status.labour.reward, labours.truceReserve)}
            onClaim={() => {
              setProblem(null);
              return labours.claim(status.labour.id);
            }}
            onProblem={setProblem}
          />
        ))
      )}
      {problem ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert">
          {problem}
        </Txt>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { marginTop: theme.space.lg, gap: theme.space.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  headerText: { flex: 1, gap: theme.space.xxs },
}));
