import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { dayStartMinutes, placeOnPath, summariseDayActivity, toPathMarks } from '@/features/dayPath';
import { formatClockMinutes, formatClockTime } from '@/lib/dates';
import type { Campaign } from '@/hooks/useCampaign';
import { useDayActivity } from '@/hooks/useDayActivity';
import type { TodayOrders } from '@/hooks/useTodayOrders';
import { createStyles } from '@/theme';

import { DayTiles } from './DayTiles';
import { type DiesState, DiesCard } from './DiesCard';

export type TodayHeroProps = {
  orders: TodayOrders;
  campaign: Campaign;
  isDawn: boolean;
  isFinished: boolean;
  /** The arc's planned wake-up, minutes after midnight. */
  plannedWakeMinutes: number | null;
  onOpenSummary: () => void;
  onOpenRun: () => void;
};

const MINUTE_MS = 60_000;

/** The hero block on Today: the Dies card, then the run and Focus tiles. */
export function TodayHero({
  orders,
  campaign,
  isDawn,
  isFinished,
  plannedWakeMinutes,
  onOpenSummary,
  onOpenRun,
}: TodayHeroProps) {
  const styles = useStyles();
  const now = useMinuteClock();
  const activity = useDayActivity(orders.today, now);
  const dayStart = dayStartMinutes(orders.wokeAt, plannedWakeMinutes);
  const { points, spans } = toPathMarks(activity.items, dayStart);
  const summary = summariseDayActivity(activity.items);
  const activityLabel = todayCopy.hero.activity(
    summary.count,
    summary.lastAt ? formatClockTime(summary.lastAt) : null,
  );

  const state: DiesState = isFinished
    ? 'finished'
    : orders.isSickDay
      ? 'sick'
      : isDawn
        ? 'dawn'
        : campaign.todayStatus;

  return (
    <View style={styles.block}>
      <DiesCard
        state={state}
        held={orders.heldCount}
        total={orders.totalCount}
        earned={campaign.todayEarned}
        plannedWake={plannedWakeMinutes != null ? formatClockMinutes(plannedWakeMinutes) : null}
        progress={placeOnPath(now, dayStart)}
        marks={points}
        spans={spans}
        day={orders.today}
        isActivityLoaded={activity.isLoaded}
        activityLabel={activityLabel}
        // Free training has no day of an arc: the hero names the run instead, when there is one.
        runDays={campaign.isLudus ? campaign.campaign : null}
        onPress={onOpenSummary}
      />
      <DayTiles
        run={campaign.campaign}
        isTodayHeld={campaign.todayStatus !== 'open'}
        isLudus={campaign.isLudus}
        nextReward={campaign.nextReward}
        onOpenRun={onOpenRun}
      />
    </View>
  );
}

/** Now, updated on each new minute, so the dot on the day path moves without a busy timer. */
function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(
      () => {
        setNow(new Date());
        interval = setInterval(() => setNow(new Date()), MINUTE_MS);
      },
      MINUTE_MS - (Date.now() % MINUTE_MS),
    );
    return () => {
      clearTimeout(first);
      if (interval) clearInterval(interval);
    };
  }, []);
  return now;
}

const useStyles = createStyles((theme) => ({
  block: { marginTop: theme.space.lg, gap: theme.space.md },
}));
