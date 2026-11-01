import { router } from 'expo-router';
import { View } from 'react-native';

import { PeriodNavigator } from '@/components/charts/PeriodNavigator';
import { HudCounters } from '@/components/hud/HudCounters';
import { IconButton } from '@/components/IconButton';
import { GloriaDayBreakdown } from '@/components/progress/GloriaDayBreakdown';
import { GloriaPeriodChart } from '@/components/progress/GloriaPeriodChart';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Txt } from '@/components/Txt';
import { periodsCopy, rewardsCopy } from '@/copy';
import { PERIOD_KINDS } from '@/features/periods';
import { useGloria } from '@/hooks/useGloria';
import { usePeriodBrowser } from '@/hooks/usePeriodBrowser';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

const copy = rewardsCopy.gloriaHistory;
const OPTIONS = periodsCopy.options(PERIOD_KINDS);

/**
 * Gloria through the journey, opened from the Gloria card on Vidi: any day (by source), week,
 * month (a bar a day) or year (a bar a month), back to the journey's first day.
 * See docs/REWARDS.md, section 5.
 */
export default function GloriaScreen() {
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);
  const gloria = useGloria();
  const browser = usePeriodBrowser('week', gloria.firstDay, gloria.today);
  const { period, kind } = browser;
  const periodLabel = periodsCopy.label(period, gloria.today);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/vidi');
  };

  return (
    <Screen gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <IconButton icon="back" accessibilityLabel={copy.back} onPress={back} />
      </View>
      <ScreenHeader eyebrow={copy.eyebrow} title={copy.title} accessory={<HudCounters />} />
      <View style={styles.body}>
        <SegmentedControl options={OPTIONS} value={kind} onChange={browser.setKind} />
        <PeriodNavigator
          label={periodLabel}
          previousLabel={periodsCopy.previous(kind)}
          nextLabel={periodsCopy.next(kind)}
          canGoBack={browser.canGoBack}
          canGoForward={browser.canGoForward}
          onPrevious={browser.goBack}
          onNext={browser.goForward}
        />
        {gloria.isLoaded ? (
          kind === 'day' ? (
            <GloriaDayBreakdown
              breakdown={gloria.breakdownOf(period.start)}
              dayLabel={periodLabel}
              tone={tone}
            />
          ) : (
            <GloriaPeriodChart
              period={period}
              byDay={gloria.byDay}
              periodLabel={periodLabel}
              today={gloria.today}
              tone={tone}
            />
          )
        ) : null}
        <Txt variant="micro">{rewardsCopy.gloria.rules}</Txt>
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: theme.space.sm },
  body: { gap: theme.space.lg, marginTop: theme.space.lg },
}));
