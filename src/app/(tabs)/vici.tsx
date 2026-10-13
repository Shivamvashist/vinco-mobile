import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AllProofCard } from '@/components/arc/AllProofCard';
import { ArcChoiceCard, type ArcChoiceState } from '@/components/arc/ArcChoiceCard';
import { ArcJourney } from '@/components/arc/ArcJourney';
import { BeginCampaignSheet } from '@/components/arc/BeginCampaignSheet';
import { DecorationGrid } from '@/components/arc/DecorationGrid';
import { LudusSheet } from '@/components/arc/LudusSheet';
import { PastArcList } from '@/components/arc/PastArcList';
import { RankCard } from '@/components/arc/RankCard';
import { RecordGrid } from '@/components/arc/RecordGrid';
import { TreasuryCard } from '@/components/arc/TreasuryCard';
import { BottomSheet } from '@/components/BottomSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { ToneLine } from '@/components/ToneLine';
import { Txt } from '@/components/Txt';
import { arcCopy, commonCopy, pickTone } from '@/copy';
import { arcEndDay, getArcPosition, isArcLength } from '@/features/arc';
import { getDecorations, TRUCES } from '@/features/campaign';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useArcChoice } from '@/hooks/useArcChoice';
import { useArcHistory } from '@/hooks/useArcHistory';
import { useCampaign } from '@/hooks/useCampaign';
import { useForum } from '@/hooks/useForum';
import { useSelfieReel } from '@/hooks/useSelfieReel';
import { useToday } from '@/hooks/useToday';
import { dayOfArc } from '@/lib/dates';
import { toRoman } from '@/lib/toRoman';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

type OpenSheet = 'truces' | 'begin' | 'ludus' | null;

/**
 * Vici: the record of the whole journey. The arc and its journey line (or the Ludus), rank,
 * the record in numbers, the treasury, decorations, every selfie, past arcs, and what's next.
 */
export default function ViciScreen() {
  const styles = useStyles();
  const today = useToday();
  const tone = usePreferencesStore((state) => state.tone);
  const { arc, targets, isLoaded } = useActiveArc();
  const campaign = useCampaign(arc, targets, today);
  const forum = useForum();
  const pastArcs = useArcHistory();
  const choice = useArcChoice();
  // Vici looks across every arc; Today and Vidi look at this campaign only.
  const allProof = useSelfieReel('all', arc, today);
  const firstSelfie = allProof.frames[0];
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const close = () => setOpenSheet(null);

  if (!arc) {
    return (
      <Screen>
        <ScreenHeader eyebrow={arcCopy.eyebrow} title={arcCopy.title} />
        {isLoaded ? (
          <View style={styles.section}>
            <ToneLine line={pickTone(arcCopy.emptyLine, tone)} tone={tone} />
          </View>
        ) : null}
      </Screen>
    );
  }

  const isLudus = arc.kind === 'ludus';
  const position = getArcPosition(arc.startDay, arc.lengthDays, today);
  const dayNumber = isLudus
    ? Math.max(1, dayOfArc(arc.startDay, today))
    : position.phase === 'active'
      ? position.dayNumber
      : position.phase === 'finished'
        ? arc.lengthDays
        : 1;
  const choiceState: ArcChoiceState = isLudus
    ? 'ludus'
    : position.phase === 'finished'
      ? 'finished'
      : 'active';
  const startLabel = commonCopy.dayLabel(arc.startDay, today);
  const endLabel = commonCopy.dayLabel(arcEndDay(arc.startDay, arc.lengthDays), today);
  const title = isLudus
    ? arcCopy.ludusName
    : isArcLength(arc.lengthDays)
      ? arcCopy.names[arc.lengthDays]
      : arcCopy.fallbackName;
  const caption = isLudus
    ? arcCopy.ludusCaption(startLabel, toRoman(Math.min(dayNumber, 3999)))
    : position.phase === 'finished'
      ? arcCopy.datesFinished(startLabel, endLabel)
      : arcCopy.dates(startLabel, endLabel, toRoman(dayNumber), toRoman(arc.lengthDays));

  const conqueredDays =
    campaign.records.filter((record) => record.result === 'conquered').length +
    (campaign.todayStatus === 'conquered' ? 1 : 0);
  const heldDays =
    campaign.records.filter((record) => record.result === 'held').length +
    (campaign.todayStatus === 'held' ? 1 : 0);
  const decorations = getDecorations({
    records: campaign.records,
    today,
    todayStatus: campaign.todayStatus,
    dayNumber,
    lengthDays: isLudus ? null : arc.lengthDays,
    selfieDays: campaign.selfieDays,
    hasOath: arc.oathPath != null,
  });

  return (
    <>
      <Screen>
        <ScreenHeader eyebrow={arcCopy.eyebrow} title={title} caption={caption} />

        {isLudus ? null : (
          <View style={styles.journey}>
            <ArcJourney
              dayNumber={dayNumber}
              lengthDays={arc.lengthDays}
              accessibilityLabel={arcCopy.journeyLabel(dayNumber, arc.lengthDays)}
            />
          </View>
        )}
        {choiceState === 'active' ? null : (
          <View style={styles.section}>
            <ArcChoiceCard
              state={choiceState}
              onBeginCampaign={() => setOpenSheet('begin')}
              onTrainInLudus={() => setOpenSheet('ludus')}
            />
          </View>
        )}
        <View style={styles.section}>
          <RankCard rank={campaign.rank} />
        </View>

        <SectionHeader title={arcCopy.stats.section} />
        <RecordGrid
          isLudus={isLudus}
          campaign={campaign.campaign}
          bestCampaign={campaign.bestCampaign}
          completedDays={campaign.completedDays}
          conqueredDays={conqueredDays}
          heldDays={heldDays}
          trucesUsed={campaign.records.filter((record) => record.result === 'truce').length}
          selfies={campaign.selfieDays}
          daysSoFar={dayNumber}
        />

        <SectionHeader title={arcCopy.treasury.section} />
        <TreasuryCard
          denarii={forum.balance}
          truces={campaign.truceReserve}
          alarmPasses={forum.holdings.venia.held}
          showTruces={!isLudus}
          onOpenForum={() => router.push('/forum')}
          onOpenTruces={() => setOpenSheet('truces')}
        />

        <SectionHeader title={arcCopy.decorations.section} />
        <DecorationGrid decorations={decorations} />

        <View style={styles.section}>
          <AllProofCard
            frames={allProof.frames.length}
            since={firstSelfie ? commonCopy.fullDateLabel(firstSelfie.day) : null}
            onPlay={() => router.push({ pathname: '/timelapse', params: { scope: 'all' } })}
          />
        </View>

        {pastArcs.length > 0 ? (
          <>
            <SectionHeader title={arcCopy.past.section} />
            <PastArcList arcs={pastArcs} today={today} />
          </>
        ) : null}

        {choiceState === 'active' ? (
          <View style={styles.leave}>
            <ArcChoiceCard
              state="active"
              onBeginCampaign={() => setOpenSheet('begin')}
              onTrainInLudus={() => setOpenSheet('ludus')}
            />
          </View>
        ) : null}
      </Screen>

      <BottomSheet
        visible={openSheet === 'truces'}
        onClose={close}
        title={arcCopy.sheets.truces(campaign.truceReserve)}
      >
        <Txt variant="body" color="textMuted">
          {arcCopy.truceInfo(TRUCES.earnedEveryCampaignDays, TRUCES.maxHeld, TRUCES.priceDenarii)}
        </Txt>
      </BottomSheet>
      <BeginCampaignSheet visible={openSheet === 'begin'} onClose={close} onBegin={choice.beginCampaign} />
      <LudusSheet
        visible={openSheet === 'ludus'}
        isLeavingCampaign={choiceState === 'active'}
        onClose={close}
        onConfirm={choice.trainInLudus}
      />
    </>
  );
}

const useStyles = createStyles((theme) => ({
  journey: { marginTop: theme.space.xxl },
  section: { marginTop: theme.space.lg },
  leave: { marginTop: theme.space.xxl },
}));
