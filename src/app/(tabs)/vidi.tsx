import { useState } from 'react';
import { View } from 'react-native';

import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Commentarii } from '@/components/progress/Commentarii';
import { type CalendarDay, MonthCalendar } from '@/components/progress/MonthCalendar';
import { StatTile } from '@/components/progress/StatTile';
import { WeightSheet } from '@/components/proof/WeightSheet';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ToneLine } from '@/components/ToneLine';
import { Txt } from '@/components/Txt';
import { pickTone, progressCopy } from '@/copy';
import { arcEndDay, getArcPosition, TIMELAPSE_SELFIES } from '@/features/arc';
import { type Campaign, useCampaign } from '@/hooks/useCampaign';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useDailySelfie } from '@/hooks/useDailySelfie';
import { useToday } from '@/hooks/useToday';
import { type DayKey, daysBetween, parseDayKey, shiftMonth } from '@/lib/dates';
import { toRoman } from '@/lib/toRoman';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

type YearMonth = { year: number; month: number };
type Segment = 'calendar' | 'logs';

const SEGMENTS: readonly { value: Segment; label: string }[] = [
  { value: 'calendar', label: progressCopy.segments.calendar },
  { value: 'logs', label: progressCopy.segments.logs },
];

/**
 * Vidi: the proof. Stats, then two views: Calendar (the arc calendar and timelapse) and the
 * Commentarii (sleep, water, workout and weight logs). See docs/DAY-FLOW.md, section 4.
 */
export default function VidiScreen() {
  const styles = useStyles();
  const today = useToday();
  const tone = usePreferencesStore((state) => state.tone);
  const { arc, targets, isLoaded: isArcLoaded } = useActiveArc();
  const campaign = useCampaign(arc, targets, today);
  const selfie = useDailySelfie(today);
  const [segment, setSegment] = useState<Segment>('calendar');
  const [isWeightSheetOpen, setIsWeightSheetOpen] = useState(false);

  const header = <ScreenHeader eyebrow={progressCopy.eyebrow} title={progressCopy.title} />;

  if (!arc) {
    return (
      <Screen>
        {header}
        {isArcLoaded ? (
          <View style={styles.section}>
            <ToneLine line={pickTone(progressCopy.emptyLine, tone)} tone={tone} />
          </View>
        ) : null}
      </Screen>
    );
  }

  const position = getArcPosition(arc.startDay, arc.lengthDays, today);
  const daysSoFar =
    position.phase === 'active' ? position.dayNumber : position.phase === 'finished' ? arc.lengthDays : 0;
  const daysToGo = position.phase === 'active' ? arc.lengthDays - position.dayNumber : 0;
  const conqueredDays =
    campaign.records.filter((record) => record.result === 'conquered').length +
    (campaign.todayStatus === 'conquered' ? 1 : 0);

  return (
    <>
      <Screen>
        {header}
        <View style={[styles.section, styles.stats]}>
          <StatTile value={String(campaign.campaign)} label={progressCopy.stats.campaign} color="accent" />
          <StatTile value={`${conqueredDays}/${daysSoFar}`} label={progressCopy.stats.fullGoalDays} />
          <StatTile value={String(daysToGo)} label={progressCopy.stats.daysToGo} />
        </View>
        <View style={styles.segments}>
          <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} />
        </View>
        {segment === 'calendar' ? (
          <>
            <View style={styles.section}>
              <ArcCalendar arc={arc} today={today} campaign={campaign} />
            </View>
            <View style={styles.section}>
              <TimelapseCard selfies={campaign.selfieDays} />
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Commentarii
              arc={arc}
              targets={targets}
              today={today}
              todayWeightKg={selfie.weightKg}
              onLogWeight={() => setIsWeightSheetOpen(true)}
            />
          </View>
        )}
      </Screen>

      <WeightSheet
        visible={isWeightSheetOpen}
        onClose={() => setIsWeightSheetOpen(false)}
        currentKg={selfie.weightKg}
        onSave={(kg) => {
          selfie.saveWeight(kg);
          setIsWeightSheetOpen(false);
        }}
      />
    </>
  );
}

type ArcCalendarProps = {
  arc: { startDay: DayKey; lengthDays: number };
  today: DayKey;
  campaign: Campaign;
};

/** The calendar, limited to the months the arc covers, opening on this month. */
function ArcCalendar({ arc, today, campaign }: ArcCalendarProps) {
  const endDay = arcEndDay(arc.startDay, arc.lengthDays);
  const firstMonth = toYearMonth(arc.startDay);
  const lastMonth = toYearMonth(daysBetween(today, endDay) < 0 ? endDay : today);
  const [shown, setShown] = useState<YearMonth>(lastMonth);
  const visible = clampMonth(shown, firstMonth, lastMonth);
  const results = new Map(campaign.records.map((record) => [record.day, record.result]));

  const describeDay = (day: DayKey): CalendarDay => {
    const isToday = day === today;
    if (daysBetween(arc.startDay, day) < 0 || daysBetween(day, endDay) < 0)
      return { status: 'outside', isToday };
    if (isToday) return { status: campaign.todayStatus, isToday };
    if (daysBetween(today, day) > 0) return { status: 'future', isToday };
    // A past day not sealed yet (sealing runs on open) reads as open until it is.
    return { status: results.get(day) ?? 'open', isToday };
  };

  return (
    <MonthCalendar
      year={visible.year}
      month={visible.month}
      describeDay={describeDay}
      canGoBack={compareMonths(visible, firstMonth) > 0}
      canGoForward={compareMonths(visible, lastMonth) < 0}
      onPrevious={() => setShown(shiftMonth(visible.year, visible.month, -1))}
      onNext={() => setShown(shiftMonth(visible.year, visible.month, 1))}
    />
  );
}

/** Selfies collected toward the first timelapse, and a way to play them once there are two. */
function TimelapseCard({ selfies }: { selfies: number }) {
  const styles = useStyles();
  const copy = progressCopy.timelapse;
  const isReady = selfies >= TIMELAPSE_SELFIES;
  return (
    <Card>
      <View style={styles.timelapseHeader}>
        <Txt variant="label">{copy.title}</Txt>
        <Txt variant="caption">{copy.count(selfies, TIMELAPSE_SELFIES)}</Txt>
      </View>
      <View style={styles.timelapseBar}>
        <ProgressBar value={selfies / TIMELAPSE_SELFIES} size="thick" accessibilityLabel={copy.title} />
      </View>
      <Txt variant="caption">{isReady ? copy.ready : copy.unlocks(toRoman(TIMELAPSE_SELFIES))}</Txt>
      {selfies >= 2 ? (
        <View style={styles.timelapsePlay}>
          <Button
            label={copy.play}
            variant="secondary"
            size="compact"
            onPress={() => router.push({ pathname: '/timelapse', params: { scope: 'arc' } })}
          />
        </View>
      ) : null}
    </Card>
  );
}

function toYearMonth(day: DayKey): YearMonth {
  const { year, month } = parseDayKey(day);
  return { year, month };
}

function compareMonths(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

function clampMonth(month: YearMonth, first: YearMonth, last: YearMonth): YearMonth {
  if (compareMonths(month, first) < 0) return first;
  if (compareMonths(month, last) > 0) return last;
  return month;
}

const useStyles = createStyles((theme) => ({
  section: { marginTop: theme.space.xl },
  stats: { flexDirection: 'row', gap: theme.space.sm },
  segments: { marginTop: theme.space.lg },
  timelapseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  timelapseBar: { marginVertical: theme.space.sm },
  timelapsePlay: { marginTop: theme.space.md },
}));
