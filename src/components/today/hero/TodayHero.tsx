import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { formatClockMinutes } from '@/lib/dates';
import type { Campaign } from '@/hooks/useCampaign';
import type { TodayOrders } from '@/hooks/useTodayOrders';
import { createStyles } from '@/theme';

import { FocusLauncher } from '../../focus/FocusLauncher';
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

const MINUTES_IN_DAY = 24 * 60;
const MINUTE_MS = 60_000;

/** The hero block on Today: the Dies card, the run and purse tiles, then the Focus row. */
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
  const dayStart = orders.wokeAt ? minutesOf(orders.wokeAt) : (plannedWakeMinutes ?? 0);
  const toProgress = (date: Date) => (minutesOf(date) - dayStart) / Math.max(1, MINUTES_IN_DAY - dayStart);

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
        progress={toProgress(now)}
        marks={orders.heldAt.map(toProgress)}
        onPress={onOpenSummary}
      />
      <DayTiles
        run={campaign.campaign}
        isTodayHeld={campaign.todayStatus !== 'open'}
        isLudus={campaign.isLudus}
        nextReward={campaign.nextReward}
        denarii={campaign.denarii}
        todayEarned={campaign.todayEarned}
        onOpenRun={onOpenRun}
        onOpenPurse={() => router.push('/forum')}
      />
      <FocusLauncher />
    </View>
  );
}

function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
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
