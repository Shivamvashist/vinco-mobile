import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/Card';
import { HudCounters } from '@/components/hud/HudCounters';
import { IconButton } from '@/components/IconButton';
import { LabourRow } from '@/components/labours/LabourRow';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Txt } from '@/components/Txt';
import { rewardsCopy } from '@/copy';
import { daysUntilReset, type LabourType, resolveClaimPay } from '@/features/labours';
import { useLabours } from '@/hooks/useLabours';
import { createStyles } from '@/theme';

const copy = rewardsCopy.labours;
const GROUPS: readonly LabourType[] = ['daily', 'weekly'];

/**
 * Labours ("Labores", tasks to earn): every labour, daily and weekly, with its progress, its pay
 * and when it resets. Claimed ones stay, marked, until their period ends. See docs/REWARDS.md.
 */
export default function LaboursScreen() {
  const styles = useStyles();
  const labours = useLabours();
  const [problem, setProblem] = useState<string | null>(null);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

  return (
    <Screen gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <IconButton icon="back" accessibilityLabel={copy.back} onPress={back} />
      </View>
      <ScreenHeader eyebrow={copy.eyebrow} title={copy.title} accessory={<HudCounters />} />
      <Txt variant="body" color="textMuted" style={styles.intro}>
        {copy.intro}
      </Txt>
      {problem ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.intro}>
          {problem}
        </Txt>
      ) : null}

      {labours.isLoaded
        ? GROUPS.map((type) => (
            <View key={type}>
              <SectionHeader title={copy.groups[type]} />
              <Txt variant="micro" style={styles.groupNote}>
                {`${copy.groupNote[type]} · ${copy.resets(type, daysUntilReset(type, labours.today))}`}
              </Txt>
              <Card bordered style={styles.list}>
                {labours.board
                  .filter((status) => status.labour.type === type)
                  .map((status) => (
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
                  ))}
              </Card>
            </View>
          ))
        : null}

      <Txt variant="micro" align="center" style={styles.wages}>
        {copy.wages}
      </Txt>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: theme.space.sm },
  intro: { marginTop: theme.space.md },
  groupNote: { marginBottom: theme.space.sm },
  list: { gap: theme.space.xxs },
  wages: { marginTop: theme.space.xxl },
}));
