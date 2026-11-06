import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { todayCopy } from '@/copy';
import {
  dayStartMinutes,
  minutesLeftInDay,
  placeOnPath,
  skyBodyAt,
  summariseDayActivity,
  toPathMarks,
} from '@/features/dayPath';
import { formatClockMinutes, formatClockTime } from '@/lib/dates';
import { useAuroraInvite } from '@/hooks/useAuroraInvite';
import type { Campaign } from '@/hooks/useCampaign';
import { useDayActivity } from '@/hooks/useDayActivity';
import { useMinuteClock } from '@/hooks/useMinuteClock';
import type { TodayOrders } from '@/hooks/useTodayOrders';
import { createStyles } from '@/theme';

import { DawnCard } from '../DawnCard';
import { RunPaySheet } from '../RunPaySheet';
import { TabSettle } from '../../TabSettle';
import { TodaySummarySheet } from '../TodaySummarySheet';
import { AuroraInvite } from './AuroraInvite';
import { DayTiles } from './DayTiles';
import { type DiesState, DiesCard } from './DiesCard';

export type TodayHeroProps = {
  orders: TodayOrders;
  campaign: Campaign;
  isDawn: boolean;
  isFinished: boolean;
  /** The arc's planned wake-up, minutes after midnight. */
  plannedWakeMinutes: number | null;
  /** "I'm up": opens the wake sheet. */
  onRise: () => void;
  /** A campaign only: opens the sick-day sheet from the dawn card. */
  onFeelingSick?: () => void;
  /** A sick day only: takes the Truce back. */
  onFeelingBetter: () => void;
};

/**
 * The top of Today: one hero slot (the dawn card until wake-up is logged, then the Dies card),
 * then the Reels and Focus tiles. Under the Dies card, while Aurora (the alarm) was never set up,
 * a slim invite to its setup flow. Owns today's summary sheet and the run pay sheet behind it.
 */
export function TodayHero({
  orders,
  campaign,
  isDawn,
  isFinished,
  plannedWakeMinutes,
  onRise,
  onFeelingSick,
  onFeelingBetter,
}: TodayHeroProps) {
  const styles = useStyles();
  const now = useMinuteClock();
  const [sheet, setSheet] = useState<'summary' | 'run' | null>(null);
  const activity = useDayActivity(orders.today, now);
  const dayStart = dayStartMinutes(orders.wokeAt, plannedWakeMinutes);
  const { points, spans } = toPathMarks(activity.items, dayStart);
  const summary = summariseDayActivity(activity.items);
  const activityLabel = todayCopy.hero.activity(
    summary.count,
    summary.lastAt ? formatClockTime(summary.lastAt) : null,
  );
  const state: DiesState = isFinished ? 'finished' : orders.isSickDay ? 'sick' : campaign.todayStatus;
  const close = () => setSheet(null);
  const auroraInvite = useAuroraInvite();
  // Not at dawn ("I'm up" is the one thing to do), on a sick day or once the arc is complete.
  const isInviting =
    auroraInvite.isShown && !isDawn && (state === 'open' || state === 'held' || state === 'conquered');

  return (
    <View style={styles.block}>
      {isDawn ? (
        <DawnCard
          hour={now.getHours()}
          plannedTime={plannedWakeMinutes != null ? formatClockMinutes(plannedWakeMinutes) : null}
          onRise={onRise}
          onFeelingSick={onFeelingSick}
        />
      ) : (
        <DiesCard
          state={state}
          held={orders.heldCount}
          total={orders.totalCount}
          progress={placeOnPath(now, dayStart)}
          marks={points}
          spans={spans}
          day={orders.today}
          isActivityLoaded={activity.isLoaded}
          activityLabel={activityLabel}
          body={skyBodyAt(now)}
          minutesLeft={minutesLeftInDay(now)}
          onPress={() => setSheet('summary')}
          onFeelingBetter={orders.isSickDay ? onFeelingBetter : undefined}
        />
      )}
      {isInviting ? (
        <TabSettle order={1}>
          <AuroraInvite onOpen={() => router.push('/aurora-setup')} onDismiss={auroraInvite.dismiss} />
        </TabSettle>
      ) : null}
      <DayTiles />

      <TodaySummarySheet
        visible={sheet === 'summary'}
        onClose={close}
        held={orders.heldCount}
        total={orders.totalCount}
        earned={campaign.todayEarned}
        run={campaign.campaign}
        activity={activity.items}
        canSeal={campaign.todayStatus !== 'open'}
        onOpenRun={() => setSheet('run')}
        onOpenDayCard={() => {
          close();
          router.push('/day-card');
        }}
      />
      <RunPaySheet
        visible={sheet === 'run'}
        onClose={close}
        nextReward={campaign.nextReward}
        isLudus={campaign.isLudus}
      />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  block: { marginTop: theme.space.lg, gap: theme.space.md },
}));
