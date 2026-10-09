import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Column } from '@/components/campaign/Column';
import { Screen } from '@/components/Screen';
import { Toast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { campaignCopy, pickTone } from '@/copy';
import { callTruce, db } from '@/db';
import { getArcPosition } from '@/features/arc';
import { findLatestLoss, type TruceOffer } from '@/features/campaign';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useCampaign } from '@/hooks/useCampaign';
import { useToday } from '@/hooks/useToday';
import { toRoman } from '@/lib/toRoman';
import { useNoticesStore, usePreferencesStore } from '@/stores';
import { createStyles, useFeedback, useReduceMotion } from '@/theme';

/** Room for the column, from the prototype. */
const COLUMN_AREA_HEIGHT = 230;

/** lost: the break. risen: Resurgo, a fresh campaign. truced: a Truce saved the campaign. */
type Outcome = { kind: 'lost' } | { kind: 'risen' } | { kind: 'truced'; campaign: number };

/**
 * Shown once when a campaign breaks (a missed day). While the break is still fresh (it ends
 * yesterday), the user can call a Truce to save the campaign. "Rise again" turns it into
 * the comeback instead: same arc, fresh campaign. Also opened from Today's Truce banner.
 */
export default function CampaignLostScreen() {
  const styles = useStyles();
  const play = useFeedback();
  const today = useToday();
  const reduceMotion = useReduceMotion();
  const tone = usePreferencesStore((state) => state.tone);
  const acknowledgeLoss = useNoticesStore((state) => state.acknowledgeLoss);
  const { arc, targets } = useActiveArc();
  const campaign = useCampaign(arc, targets, today);
  const loss = findLatestLoss(campaign.records);
  const lossDay = loss?.day ?? null;
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'lost' });
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  const offer = outcome.kind === 'lost' ? campaign.truceOffer : null;

  // Seen once is enough: never shown again for this break, whatever the user taps.
  useEffect(() => {
    if (lossDay) acknowledgeLoss(lossDay);
  }, [lossDay, acknowledgeLoss]);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

  const callTruceNow = (truceOffer: TruceOffer) => {
    try {
      callTruce(db, truceOffer.days);
      setOutcome({ kind: 'truced', campaign: truceOffer.campaignSaved });
    } catch (error) {
      if (__DEV__) console.warn('[campaign] Truce failed.', error);
      play('denied');
      setToast(campaignCopy.truce.failed);
    }
  };

  const position = arc ? getArcPosition(arc.startDay, arc.lengthDays, today) : null;
  const dayRoman = toRoman(position?.phase === 'active' ? position.dayNumber : 1);
  const lengthRoman = toRoman(arc?.lengthDays ?? 1);
  const daysLost = loss?.campaignBefore ?? 0;
  const enter = (delay: number) => (reduceMotion ? undefined : FadeInDown.delay(delay).duration(500));

  return (
    <Screen scroll={false} gutter="flow" edges={['top', 'bottom']}>
      {/* Scrolls on small phones; the buttons stay pinned below. */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.columnArea}>
          <Column state={outcome.kind === 'lost' ? 'fallen' : 'standing'} />
        </View>

        {outcome.kind === 'truced' ? (
          <View style={styles.body} key="truced">
            <Animated.View entering={enter(400)} style={styles.badge}>
              <Txt variant="headingSmall" color="accent" style={styles.badgeText}>
                {campaignCopy.truced.badge}
              </Txt>
            </Animated.View>
            <Animated.View entering={enter(600)}>
              <Txt variant="title" align="center" accessibilityRole="header">
                {campaignCopy.truced.title}
              </Txt>
              <Txt variant="body" color="textMuted" align="center" style={styles.gap}>
                {campaignCopy.truced.detail(outcome.campaign, campaign.truceReserve)}
              </Txt>
            </Animated.View>
          </View>
        ) : outcome.kind === 'risen' ? (
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
            {offer ? (
              <Animated.View entering={enter(350)}>
                <Card bordered style={styles.historyCard}>
                  <Txt variant="label" color="accent">
                    {campaignCopy.truce.title}
                  </Txt>
                  <Txt variant="body" style={styles.small}>
                    {describeOffer(offer, campaign.truceReserve, campaign.denarii)}
                  </Txt>
                </Card>
              </Animated.View>
            ) : null}
            <Animated.View entering={enter(offer ? 450 : 350)}>
              <Card style={styles.historyCard}>
                <Txt variant="body">{campaignCopy.lost.history(daysLost)}</Txt>
              </Card>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {outcome.kind === 'truced' ? (
          <Button label={campaignCopy.truced.toToday} onPress={leave} />
        ) : outcome.kind === 'risen' ? (
          <Button label={campaignCopy.risen.toToday} onPress={leave} />
        ) : (
          <>
            {offer?.canAfford ? (
              <Button
                label={
                  offer.toBuy > 0
                    ? campaignCopy.truce.actionWithCost(offer.days.length, offer.cost)
                    : campaignCopy.truce.action(offer.days.length)
                }
                cue="truce"
                onPress={() => callTruceNow(offer)}
              />
            ) : null}
            <Button
              label={campaignCopy.lost.rise}
              variant={offer?.canAfford ? 'secondary' : 'primary'}
              cue="rise"
              onPress={() => setOutcome({ kind: 'risen' })}
            />
          </>
        )}
      </View>
      <Toast message={toast} onHide={hideToast} />
    </Screen>
  );
}

/** What calling a Truce would cost, in words. */
function describeOffer(offer: TruceOffer, reserve: number, denarii: number): string {
  const days = offer.days.length;
  const held = Math.max(0, denarii);
  if (!offer.canAfford) return campaignCopy.truce.cannotAfford(offer.cost, held);
  if (offer.toBuy > 0) return campaignCopy.truce.withPurchase(days, reserve, offer.cost, held);
  return campaignCopy.truce.fromReserve(days, offer.campaignSaved, reserve);
}

const useStyles = createStyles((theme) => ({
  columnArea: {
    height: COLUMN_AREA_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: theme.space.xxl,
  },
  scroll: { flex: 1 },
  body: { marginTop: theme.space.xxl, paddingBottom: theme.space.lg },
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
  footer: { paddingTop: theme.space.md, gap: theme.space.sm },
}));
