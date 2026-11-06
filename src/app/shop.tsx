import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { HudCounters } from '@/components/hud/HudCounters';
import { IconButton } from '@/components/IconButton';
import { notify } from '@/components/notices';
import { QuestBoard } from '@/components/quests/QuestBoard';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { EarnList } from '@/components/shop/EarnList';
import { PurchaseSheet } from '@/components/shop/PurchaseSheet';
import { SegmentRise } from '@/components/shop/SegmentRise';
import { ShopPurse } from '@/components/shop/ShopPurse';
import { ShopShelf } from '@/components/shop/ShopShelf';
import { TreasuryHistory } from '@/components/shop/TreasuryHistory';
import { TabSettle } from '@/components/TabSettle';
import { Txt } from '@/components/Txt';
import { shopCopy } from '@/copy';
import type { ForumItem } from '@/features/forum';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useForum } from '@/hooks/useForum';
import { useLabours } from '@/hooks/useLabours';
import { usePreferencesStore } from '@/stores';
import { createStyles, useFeedback } from '@/theme';

type Segment = 'shop' | 'earn' | 'history';

const SEGMENT_VALUES: readonly Segment[] = ['shop', 'earn', 'history'];

/**
 * The Shop ("the Forum" in code): the purse, then three tabs. Shop: the shelf (Essentials, day
 * cards, app icons). Earn: the quests to claim, then the pay that lands on its own. History: every
 * denarius in and out. Opens on a tab with `?tab=earn`. The HUD counters stay in the header, so a
 * claim's coins and laurels fly to them. Denarii are earned, never bought with real money.
 * See docs/REWARDS.md.
 */
export default function ShopScreen() {
  const styles = useStyles();
  const play = useFeedback();
  const params = useLocalSearchParams<{ tab?: string }>();
  const forum = useForum();
  const labours = useLabours();
  const { arc } = useActiveArc();
  const tone = usePreferencesStore((state) => state.tone);
  const [segment, setSegment] = useState<Segment>(() => toSegment(params.tab));
  const [selected, setSelected] = useState<ForumItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLudus = arc?.kind === 'ludus';
  const ready = labours.board.filter((status) => status.state === 'claimable').length;

  const segments = [
    { value: 'shop' as const, label: shopCopy.segments.shop },
    {
      value: 'earn' as const,
      label: shopCopy.segments.earn,
      badge: { count: ready, label: shopCopy.readyBadge(ready) },
    },
    { value: 'history' as const, label: shopCopy.segments.history },
  ];

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/vici');
  };

  const close = () => {
    setSelected(null);
    setError(null);
  };

  const buy = () => {
    if (!selected) return;
    const problem = forum.buy(selected.id);
    if (problem === null) {
      play('chime');
      notify({ kind: 'success', message: shopCopy.sheet.bought(shopCopy.items[selected.id].name) });
      close();
      return;
    }
    play('denied');
    setError(problem === 'failed' ? shopCopy.sheet.failed : null);
  };

  return (
    <>
      <Screen gutter="flow" edges={['top', 'bottom']}>
        <View style={styles.nav}>
          <IconButton icon="back" accessibilityLabel={shopCopy.back} onPress={back} />
        </View>
        <ScreenHeader eyebrow={shopCopy.eyebrow} title={shopCopy.title} accessory={<HudCounters />} />

        <TabSettle order={0} style={styles.purse}>
          <ShopPurse
            balance={forum.balance}
            earnedThisWeek={forum.earnedThisWeek}
            onEarnMore={segment === 'earn' ? undefined : () => setSegment('earn')}
          />
        </TabSettle>

        <View style={styles.segments}>
          <SegmentedControl options={segments} value={segment} onChange={setSegment} />
        </View>

        <SegmentRise key={segment}>
          {segment === 'shop' ? (
            <ShopShelf holdings={forum.holdings} isLudus={isLudus} onSelect={setSelected} />
          ) : null}
          {segment === 'earn' ? (
            <View style={styles.block}>
              {labours.isLoaded ? (
                <QuestBoard
                  board={labours.board}
                  today={labours.today}
                  truceReserve={labours.truceReserve}
                  tone={tone}
                  onClaim={labours.claim}
                />
              ) : null}
              <View style={styles.wages}>
                <EarnList isLudus={isLudus} />
              </View>
            </View>
          ) : null}
          {segment === 'history' ? (
            <View style={styles.block}>
              <TreasuryHistory entries={forum.history} today={forum.today} />
            </View>
          ) : null}
        </SegmentRise>

        <Txt variant="micro" align="center" style={styles.rule}>
          {shopCopy.rule}
        </Txt>
      </Screen>

      <PurchaseSheet
        item={selected}
        holding={selected ? forum.holdings[selected.id] : null}
        balance={forum.balance}
        error={error}
        onBuy={buy}
        onClose={close}
      />
    </>
  );
}

/** The tab named in the link, or the shelf. */
function toSegment(value: unknown): Segment {
  return SEGMENT_VALUES.find((segment) => segment === value) ?? 'shop';
}

const useStyles = createStyles((theme) => ({
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: theme.space.sm },
  purse: { marginTop: theme.space.lg },
  segments: { marginTop: theme.space.lg },
  block: { marginTop: theme.space.xxl },
  wages: { marginTop: theme.space.xxxl },
  rule: { marginTop: theme.space.xxl },
}));
