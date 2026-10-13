import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { EarnList } from '@/components/forum/EarnList';
import { ForumItemCard } from '@/components/forum/ForumItemCard';
import { PurchaseSheet } from '@/components/forum/PurchaseSheet';
import { TreasuryHistory } from '@/components/forum/TreasuryHistory';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Toast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { forumCopy } from '@/copy';
import { type ForumCategory, FORUM_ITEMS, type ForumItem } from '@/features/forum';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useForum } from '@/hooks/useForum';
import { createStyles, useFeedback } from '@/theme';

type Segment = 'shop' | 'earn' | 'history';

const SEGMENTS: readonly { value: Segment; label: string }[] = [
  { value: 'shop', label: forumCopy.segments.shop },
  { value: 'earn', label: forumCopy.segments.earn },
  { value: 'history', label: forumCopy.segments.history },
];
const CATEGORIES: readonly ForumCategory[] = ['supplies', 'cards', 'insignia'];
const COIN_SIZE = 28;

/**
 * The Forum: the purse, the shop, every way to earn, and the history of every denarius.
 * Denarii are earned, never bought with real money. See docs/WAVE-2.md, section 3.
 */
export default function ForumScreen() {
  const styles = useStyles();
  const play = useFeedback();
  const forum = useForum();
  const { arc } = useActiveArc();
  const [segment, setSegment] = useState<Segment>('shop');
  const [selected, setSelected] = useState<ForumItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

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
      setToast(forumCopy.sheet.bought(forumCopy.items[selected.id].name));
      close();
      return;
    }
    play('denied');
    setError(problem === 'failed' ? forumCopy.sheet.failed : null);
  };

  return (
    <>
      <Screen gutter="flow" edges={['top', 'bottom']}>
        <View style={styles.nav}>
          <IconButton icon="back" accessibilityLabel={forumCopy.back} onPress={back} />
        </View>
        <ScreenHeader eyebrow={forumCopy.eyebrow} title={forumCopy.title} />

        <View
          style={styles.purse}
          accessible
          accessibilityLabel={`${forumCopy.balanceLabel}: ${forumCopy.balance(forum.balance)}`}
        >
          <Icon name="coin" size={COIN_SIZE} color="currency" />
          <View style={styles.purseText}>
            <Txt variant="micro">{forumCopy.balanceLabel}</Txt>
            <Txt variant="heading" color="currency">
              {forumCopy.balance(forum.balance)}
            </Txt>
          </View>
          <Txt variant="caption" style={styles.week}>
            {forumCopy.earnedThisWeek(forum.earnedThisWeek)}
          </Txt>
        </View>

        <View style={styles.segments}>
          <SegmentedControl options={SEGMENTS} value={segment} onChange={setSegment} />
        </View>

        {segment === 'shop'
          ? CATEGORIES.map((category) => (
              <View key={category}>
                <SectionHeader title={forumCopy.categories[category]} />
                <View style={styles.list}>
                  {FORUM_ITEMS.filter((item) => item.category === category).map((item) => (
                    <ForumItemCard
                      key={item.id}
                      item={item}
                      holding={forum.holdings[item.id]}
                      isLudus={arc?.kind === 'ludus'}
                      onPress={() => setSelected(item)}
                    />
                  ))}
                </View>
              </View>
            ))
          : null}
        {segment === 'earn' ? (
          <View style={styles.block}>
            <EarnList isLudus={arc?.kind === 'ludus'} />
          </View>
        ) : null}
        {segment === 'history' ? (
          <View style={styles.block}>
            <TreasuryHistory entries={forum.history} today={forum.today} />
          </View>
        ) : null}

        <Txt variant="micro" align="center" style={styles.rule}>
          {forumCopy.rule}
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
      <Toast message={toast} onHide={hideToast} />
    </>
  );
}

const useStyles = createStyles((theme) => ({
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: theme.space.sm },
  purse: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.space.md,
    marginTop: theme.space.lg,
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  purseText: { flex: 1, minWidth: 120 },
  week: { flexShrink: 1 },
  segments: { marginTop: theme.space.lg },
  list: { gap: theme.space.sm },
  block: { marginTop: theme.space.xxl },
  rule: { marginTop: theme.space.xxl },
}));
