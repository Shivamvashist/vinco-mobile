import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Column } from '@/components/campaign/Column';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { campaignCopy, pickTone } from '@/copy';
import { getArcPosition } from '@/features/arc';
import { findLatestLoss } from '@/features/campaign';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useCampaign } from '@/hooks/useCampaign';
import { useToday } from '@/hooks/useToday';
import { toRoman } from '@/lib/toRoman';
import { useNoticesStore, usePreferencesStore } from '@/stores';
import { createStyles, useReduceMotion } from '@/theme';

/** Room for the column, from the prototype. */
const COLUMN_AREA_HEIGHT = 230;

/**
 * Shown once when a campaign breaks (a missed day with no Truce left).
 * "Rise again" turns it into the comeback: same arc, fresh campaign.
 */
export default function CampaignLostScreen() {
  const styles = useStyles();
  const today = useToday();
  const reduceMotion = useReduceMotion();
  const tone = usePreferencesStore((state) => state.tone);
  const acknowledgeLoss = useNoticesStore((state) => state.acknowledgeLoss);
  const { arc, targets } = useActiveArc();
  const campaign = useCampaign(arc, targets, today);
  const loss = findLatestLoss(campaign.records);
  const lossDay = loss?.day ?? null;
  const [hasRisen, setHasRisen] = useState(false);

  // Seen once is enough: never shown again for this break, whatever the user taps.
  useEffect(() => {
    if (lossDay) acknowledgeLoss(lossDay);
  }, [lossDay, acknowledgeLoss]);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

  const position = arc ? getArcPosition(arc.startDay, arc.lengthDays, today) : null;
  const dayRoman = toRoman(position?.phase === 'active' ? position.dayNumber : 1);
  const lengthRoman = toRoman(arc?.lengthDays ?? 1);
  const daysLost = loss?.campaignBefore ?? 0;
  const enter = (delay: number) => (reduceMotion ? undefined : FadeInDown.delay(delay).duration(500));

  return (
    <Screen scroll={false} gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.columnArea}>
        <Column state={hasRisen ? 'standing' : 'fallen'} />
      </View>

      {hasRisen ? (
        <View style={styles.body} key="risen">
          <Animated.View entering={enter(400)} style={styles.badge}>
            <Txt variant="headingSmall" color="accent" style={styles.badgeText}>
              {campaignCopy.risen.badge}
            </Txt>
          </Animated.View>
          <Animated.View entering={enter(600)}>
            <Txt variant="title" align="center" accessibilityRole="header">
              {campaignCopy.risen.title}
            </Txt>
            <Txt variant="body" color="textMuted" align="center" style={styles.gap}>
              {campaignCopy.risen.detail(dayRoman, lengthRoman)}
            </Txt>
          </Animated.View>
          <Animated.View entering={enter(800)} style={styles.quote}>
            <Txt variant="quote">{campaignCopy.risen.quote}</Txt>
            <Txt variant="caption" style={styles.small}>
              {campaignCopy.risen.quoteMeaning}
            </Txt>
          </Animated.View>
        </View>
      ) : (
        <View style={styles.body} key="lost">
          <Animated.View entering={enter(200)}>
            <Txt variant="eyebrow" color="danger">
              {campaignCopy.lost.eyebrow(daysLost)}
            </Txt>
            <Txt variant="title" accessibilityRole="header" style={styles.small}>
              {campaignCopy.lost.title}
            </Txt>
            <Txt variant="body" color="textMuted" style={styles.gap}>
              {pickTone(campaignCopy.lost.toneLine, tone)}
            </Txt>
          </Animated.View>
          <Animated.View entering={enter(350)}>
            <Card style={styles.historyCard}>
              <Txt variant="body">{campaignCopy.lost.history(daysLost)}</Txt>
            </Card>
          </Animated.View>
        </View>
      )}

      <View style={styles.footer}>
        {hasRisen ? (
          <Button label={campaignCopy.risen.toToday} onPress={leave} />
        ) : (
          <Button label={campaignCopy.lost.rise} cue="rise" onPress={() => setHasRisen(true)} />
        )}
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  columnArea: {
    height: COLUMN_AREA_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: theme.space.xxl,
  },
  body: { flex: 1, marginTop: theme.space.xxl },
  badge: {
    alignSelf: 'center',
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidthStrong,
    borderColor: theme.colors.accent,
    marginBottom: theme.space.lg,
  },
  badgeText: { letterSpacing: 3 },
  gap: { marginTop: theme.space.sm },
  small: { marginTop: theme.space.xs },
  historyCard: { marginTop: theme.space.xl },
  quote: { marginTop: theme.space.xxl },
  footer: { paddingTop: theme.space.md },
}));
