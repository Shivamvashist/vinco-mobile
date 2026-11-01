import { router } from 'expo-router';
import { FlatList, View } from 'react-native';

import { PeriodNavigator } from '@/components/charts/PeriodNavigator';
import { FocusPeriodChart } from '@/components/focus/FocusPeriodChart';
import { FocusPeriodStats } from '@/components/focus/FocusPeriodStats';
import { FocusSessionRow } from '@/components/focus/FocusSessionRow';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Txt } from '@/components/Txt';
import { focusCopy, periodsCopy, pickTone } from '@/copy';
import { focusPeriodBars, sessionsInPeriod, summarizeFocusPeriod } from '@/features/focus';
import type { PeriodKind } from '@/features/periods';
import { useFocusHistory } from '@/hooks/useFocusLog';
import { usePeriodBrowser } from '@/hooks/usePeriodBrowser';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

const copy = focusCopy.history;
const KINDS: readonly PeriodKind[] = ['week', 'month', 'year'];
const OPTIONS = periodsCopy.options(KINDS);

/**
 * The full focus log, opened from "See all" under the focus setup: a week, month or year of focus
 * as bars (held in gold, retreated time muted above), the period in numbers and by guard, then its
 * sessions. A focus counts on the day it began; a running one waits until it settles.
 * Spec: docs/TODAY-AND-FOCUS.md section 4.
 */
export default function FocusLogScreen() {
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);
  const history = useFocusHistory();
  const browser = usePeriodBrowser('week', history.firstDay, history.today);
  const { period, kind } = browser;
  const sessions = sessionsInPeriod(history.sessions, period);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/focus');
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.nav}>
        <IconButton icon="back" accessibilityLabel={copy.back} onPress={back} />
      </View>
      <ScreenHeader eyebrow={copy.eyebrow} title={copy.title} />
      <SegmentedControl options={OPTIONS} value={kind} onChange={browser.setKind} />
      <PeriodNavigator
        label={periodsCopy.label(period, history.today)}
        previousLabel={periodsCopy.previous(kind)}
        nextLabel={periodsCopy.next(kind)}
        canGoBack={browser.canGoBack}
        canGoForward={browser.canGoForward}
        onPrevious={browser.goBack}
        onNext={browser.goForward}
      />
      <FocusPeriodChart
        period={period}
        bars={focusPeriodBars(history.sessions, period)}
        today={history.today}
      />
      {sessions.length > 0 ? (
        <>
          <FocusPeriodStats summary={summarizeFocusPeriod(history.sessions, period)} today={history.today} />
          <Txt variant="overline" accessibilityRole="header" style={styles.listTitle}>
            {copy.sessions}
          </Txt>
        </>
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false} gutter="none" edges={['top', 'bottom']}>
      <FlatList
        data={sessions}
        keyExtractor={(session) => String(session.id)}
        ListHeaderComponent={header}
        ListEmptyComponent={
          history.isLoaded ? (
            <Txt variant="body" color="textMuted" style={styles.empty}>
              {pickTone(copy.empty, tone)}
            </Txt>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.item,
              index === 0 && styles.itemFirst,
              index === sessions.length - 1 && styles.itemLast,
            ]}
          >
            <FocusSessionRow session={item} today={history.today} hasDivider={index > 0} />
          </View>
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        windowSize={7}
      />
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  content: {
    paddingHorizontal: theme.layout.flowGutter,
    paddingTop: theme.space.xxl,
    paddingBottom: theme.space.xxxl,
  },
  header: { gap: theme.space.lg },
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: -theme.space.sm },
  listTitle: { marginTop: theme.space.sm, marginBottom: theme.space.sm },
  empty: { marginTop: theme.space.lg },
  item: {
    paddingHorizontal: theme.layout.cardPadding,
    backgroundColor: theme.colors.surfaceSunk,
  },
  itemFirst: {
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
  },
  itemLast: {
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
  },
}));
