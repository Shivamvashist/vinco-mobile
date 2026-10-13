import { View } from 'react-native';

import { commonCopy, forumCopy } from '@/copy';
import type { TreasuryEntry } from '@/hooks/useForum';
import type { DayKey } from '@/lib/dates';
import { createStyles } from '@/theme';

import { Txt } from '../Txt';

const copy = forumCopy.history;
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
            ? copy.purchase(forumCopy.items[entry.source.itemId].name)
            : (copy.reasons[entry.source.reason] ?? entry.source.reason);
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

const useStyles = createStyles((theme) => ({
  list: { borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, overflow: 'hidden' },
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
