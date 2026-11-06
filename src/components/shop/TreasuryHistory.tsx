import { View } from 'react-native';

import { commonCopy, shopCopy, rewardsCopy } from '@/copy';
import { isFocusRetreatReason } from '@/features/focus';
import type { TreasuryEntry } from '@/hooks/useForum';
import type { DayKey } from '@/lib/dates';
import { cardSurface, createStyles } from '@/theme';

import { Txt } from '../Txt';

const copy = shopCopy.history;
/** The list stays short; older lines are still counted in the balance. */
const MAX_ROWS = 40;

export type TreasuryHistoryProps = {
  entries: readonly TreasuryEntry[];
  today: DayKey;
};

/** Every denarius in and out, newest first: "+10 Day conquered · Yesterday". */
export function TreasuryHistory({ entries, today }: TreasuryHistoryProps) {
  const styles = useStyles();
  if (entries.length === 0) {
    return (
      <Txt variant="body" color="textMuted">
        {copy.empty}
      </Txt>
    );
  }
  return (
    <View style={styles.list}>
      {entries.slice(0, MAX_ROWS).map((entry, index) => {
        const label =
          entry.source.type === 'purchase'
            ? copy.purchase(shopCopy.items[entry.source.itemId].name)
            : describeReason(entry.source.reason);
        const amount = copy.amount(entry.amount);
        const date = commonCopy.dayLabel(entry.day, today);
        return (
          <View
            key={entry.key}
            style={[styles.row, index > 0 && styles.divider]}
            accessible
            accessibilityLabel={`${amount}, ${label}, ${date}`}
          >
            <View style={styles.text}>
              <Txt variant="body">{label}</Txt>
              <Txt variant="micro">{date}</Txt>
            </View>
            <Txt variant="label" color={entry.amount > 0 ? 'currency' : 'textMuted'}>
              {amount}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

/** A ledger row's line: a known reason, a focus retreat, a claim (labour or decoration), or the raw key. */
function describeReason(reason: string): string {
  if (isFocusRetreatReason(reason)) return copy.focusRetreat;
  return copy.reasons[reason] ?? rewardsCopy.ledger.claim(reason) ?? reason;
}

const useStyles = createStyles((theme) => ({
  list: { ...cardSurface(theme), overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  divider: { borderTopWidth: theme.layout.hairline, borderTopColor: theme.colors.border },
  text: { flex: 1, gap: theme.space.xxs },
}));
