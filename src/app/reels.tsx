import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { ReelLogChart } from '@/components/reels/ReelLogChart';
import { ReelPassSheet } from '@/components/reels/ReelPassSheet';
import { ReelSettings } from '@/components/reels/ReelSettings';
import { ReelStatusRow } from '@/components/reels/ReelStatusRow';
import { ReelTodayCard } from '@/components/reels/ReelTodayCard';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { reelsCopy } from '@/copy';
import { getReelBadgeStage, levelIncludes, REEL_PASS } from '@/features/guard';
import { useGuardPermissions } from '@/hooks/useGuardPermissions';
import { useReelCount } from '@/hooks/useReelCount';
import { useReelLog } from '@/hooks/useReelLog';
import { useGuardStore } from '@/stores';
import { createStyles, useFeedback } from '@/theme';

/**
 * The reel counter (from the Reels tile on Today and the guard screen): today against the budget,
 * the log as bars (Day or Week), the reel pass, and the settings that matter for reels.
 *
 * Opened as /reels?pass=1 (the native badge's panel or the blocking card), it opens the pass's
 * confirm sheet once, then clears the link on this screen (the global router can't navigate yet on
 * a cold start from the overlay). Purchases happen here only, so the ledger has one writer.
 * Passes and counts belong to the reel day (the phone's own date; see useReelDay).
 */
export default function ReelsScreen() {
  const styles = useStyles();
  const play = useFeedback();
  const level = useGuardStore((state) => state.level);
  const budget = useGuardStore((state) => state.reelBudget);
  const reels = useReelCount();
  const log = useReelLog();
  const permissions = useGuardPermissions();
  const navigation = useNavigation();
  const { pass: passParam } = useLocalSearchParams<{ pass?: string }>();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The passes the user is looking at when the sheet opens: a double tap buys once.
  const [seenPasses, setSeenPasses] = useState(0);

  const isLoaded = reels.isLoaded && log.isLoaded;
  const openSheet = () => {
    setError(null);
    setSeenPasses(reels.passes);
    setIsSheetOpen(true);
  };

  // From the overlay: open the confirm sheet once the counts are read, then clear the link.
  const isPassLink = passParam === '1';
  const [hasHandledLink, setHasHandledLink] = useState(false);
  if (isPassLink && isLoaded && !hasHandledLink) {
    setHasHandledLink(true);
    openSheet();
  }
  if (!isPassLink && hasHandledLink) setHasHandledLink(false);
  useEffect(() => {
    if (isPassLink && hasHandledLink) navigation.setParams({ pass: undefined } as never);
  }, [isPassLink, hasHandledLink, navigation]);

  const stage = getReelBadgeStage(reels.today, reels.allowance);
  const canOfferPass =
    levelIncludes(level, 'vigil') && stage !== 'calm' && reels.passes < REEL_PASS.maxPerDay;

  const buy = () => {
    const result = log.buyPass(reels.day, seenPasses);
    if (result == null) {
      play('chime');
      setIsSheetOpen(false);
      return;
    }
    play('denied');
    setError(result === 'failed' ? reelsCopy.sheet.failed : null);
  };

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

  return (
    <Screen gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <IconButton icon="back" accessibilityLabel={reelsCopy.back} onPress={back} />
      </View>
      <ScreenHeader eyebrow={reelsCopy.eyebrow} title={reelsCopy.title} />
      <View style={styles.body}>
        <ReelStatusRow canCount={reels.canCount} isServiceOn={permissions.granted?.accessibility ?? null} />
        <ReelTodayCard
          count={reels.today}
          allowance={reels.allowance}
          passes={reels.passes}
          canOfferPass={canOfferPass}
          onPass={openSheet}
        />
      </View>
      <SectionHeader title={reelsCopy.log.section} />
      <ReelLogChart days={log.days} passesByDay={log.passesByDay} budget={budget} today={reels.day} />
      <SectionHeader title={reelsCopy.settings.section} />
      <ReelSettings />
      <ReelPassSheet
        visible={isSheetOpen}
        passes={reels.passes}
        balance={log.balance}
        isPax={!levelIncludes(level, 'vigil')}
        error={error}
        onBuy={buy}
        onClose={() => setIsSheetOpen(false)}
      />
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: theme.space.sm },
  body: { gap: theme.space.lg, marginTop: theme.space.lg },
}));
