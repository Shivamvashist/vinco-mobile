import { useState } from 'react';
import { View } from 'react-native';

import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Commentarii } from '@/components/progress/Commentarii';
import { DaySummarySheet } from '@/components/progress/DaySummarySheet';
import { GloriaCard } from '@/components/progress/GloriaCard';
import { ArcCalendar } from '@/components/progress/ArcCalendar';
import { type CalendarDayStatus } from '@/components/progress/MonthCalendar';
import { StatTile } from '@/components/progress/StatTile';
import { WeightSheet } from '@/components/proof/WeightSheet';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ToneLine } from '@/components/ToneLine';
import { Txt } from '@/components/Txt';
import { pickTone, progressCopy } from '@/copy';
import { getArcPosition, TIMELAPSE_SELFIES } from '@/features/arc';
import { conqueredDayGloria } from '@/features/gloria';
import { useCampaign } from '@/hooks/useCampaign';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useDailySelfie } from '@/hooks/useDailySelfie';
import { useGloria } from '@/hooks/useGloria';
import { useSealedResults } from '@/hooks/useSealedResults';
import { useToday } from '@/hooks/useToday';
import type { DayKey } from '@/lib/dates';
import { toRoman } from '@/lib/toRoman';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

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
  const sealed = useSealedResults();
  const gloria = useGloria();
  const [segment, setSegment] = useState<Segment>('calendar');
  const [isWeightSheetOpen, setIsWeightSheetOpen] = useState(false);
  const [openDay, setOpenDay] = useState<{ day: DayKey; status: CalendarDayStatus } | null>(null);

  if (!arc) {
    return (
      <Screen gutter="tabBody">
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
      <Screen gutter="tabBody">
        <View style={[styles.section, styles.stats]}>
          {campaign.isLudus ? (
            <>
              <StatTile
                value={String(campaign.completedDays)}
                label={progressCopy.stats.daysTrained}
                color="accent"
              />
              <StatTile value={`${conqueredDays}/${daysSoFar}`} label={progressCopy.stats.fullGoalDays} />
              <StatTile value={String(campaign.selfieDays)} label={progressCopy.stats.selfies} />
            </>
          ) : (
            <>
              <StatTile
                value={String(campaign.campaign)}
                label={progressCopy.stats.campaign}
                color="accent"
              />
              <StatTile value={`${conqueredDays}/${daysSoFar}`} label={progressCopy.stats.fullGoalDays} />
              <StatTile value={String(daysToGo)} label={progressCopy.stats.daysToGo} />
            </>
          )}
        </View>
        <View style={styles.section}>
          <GloriaCard
            total={gloria.total}
            thisWeek={gloria.thisWeek}
            conqueredDay={conqueredDayGloria(gloria.dayOf(today)?.orderStatuses.length ?? 0)}
            today={today}
          />
        </View>
        <View style={styles.segments}>
          <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} />
        </View>
        {segment === 'calendar' ? (
          <>
            <View style={styles.section}>
              <ArcCalendar
                arc={arc}
                today={today}
                records={campaign.records}
                todayStatus={campaign.todayStatus}
                isLudus={campaign.isLudus}
                pastResults={sealed.results}
                firstRecordDay={sealed.firstDay}
                onOpenDay={(day, status) => setOpenDay({ day, status })}
                gloriaByDay={gloria.byDay}
              />
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

      <DaySummarySheet
        day={openDay?.day ?? null}
        status={openDay?.status ?? 'open'}
        isLudus={campaign.isLudus}
        arcId={arc.id}
        targets={targets}
        onClose={() => setOpenDay(null)}
      />
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

const useStyles = createStyles((theme) => ({
  section: { marginTop: theme.space.xl },
  stats: { flexDirection: 'row', gap: theme.space.sm },
  segments: { marginTop: theme.space.lg },
  timelapseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  timelapseBar: { marginVertical: theme.space.sm },
  timelapsePlay: { marginTop: theme.space.md },
}));
