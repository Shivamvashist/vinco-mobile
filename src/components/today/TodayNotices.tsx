import { router } from 'expo-router';
import { View } from 'react-native';

import { todayCopy } from '@/copy';
import type { TruceOffer } from '@/features/campaign';
import { createStyles } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { Txt } from '../Txt';
import { TruceBanner } from './TruceBanner';

export type TodayNoticesProps = {
  /** What a Truce would save right now, or null when nothing can be saved. */
  truceOffer: TruceOffer | null;
  /** The campaign is past its last day. */
  isFinished: boolean;
  /** The last change could not be saved. */
  hasSaveError: boolean;
};

/**
 * The few things that may sit between the tiles and Today's section, each only while it applies:
 * a Truce that can still save the campaign, a finished campaign, a change that wasn't saved.
 */
export function TodayNotices({ truceOffer, isFinished, hasSaveError }: TodayNoticesProps) {
  const styles = useStyles();
  return (
    <>
      {truceOffer ? (
        <View style={styles.notice}>
          <TruceBanner
            campaign={truceOffer.campaignSaved}
            missedDays={truceOffer.days.length}
            onOpen={() => router.push('/campaign-lost')}
          />
        </View>
      ) : null}

      {isFinished ? (
        <Card bordered style={[styles.notice, styles.finished]}>
          <Txt variant="label" accessibilityRole="header" style={styles.finishedTitle}>
            {todayCopy.finished.title}
          </Txt>
          <Button label={todayCopy.finished.action} size="compact" onPress={() => router.navigate('/vici')} />
        </Card>
      ) : null}

      {hasSaveError ? (
        <Card variant="sunk" style={[styles.notice, styles.error]} accessibilityRole="alert">
          <Txt variant="caption" color="danger">
            {todayCopy.saveError}
          </Txt>
        </Card>
      ) : null}
    </>
  );
}

const useStyles = createStyles((theme) => ({
  notice: { marginTop: theme.space.lg },
  finished: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space.sm },
  finishedTitle: { flex: 1 },
  error: { borderWidth: theme.layout.borderWidth, borderColor: theme.colors.dangerBorder },
}));
