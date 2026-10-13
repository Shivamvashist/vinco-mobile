import { View } from 'react-native';

import { arcCopy, commonCopy } from '@/copy';
import { isArcLength, type PastArc } from '@/features/arc';
import type { DayKey } from '@/lib/dates';
import { createStyles } from '@/theme';

import { Txt } from '../Txt';

export type PastArcListProps = {
  arcs: readonly PastArc[];
  today: DayKey;
};

const copy = arcCopy.past;

/** Earlier campaigns and Ludus stints, newest first: name, dates, how it ended, days done. */
export function PastArcList({ arcs, today }: PastArcListProps) {
  const styles = useStyles();
  return (
    <View style={styles.list}>
      {arcs.map((arc, index) => {
        const name =
          arc.lengthDays == null
            ? copy.ludus
            : isArcLength(arc.lengthDays)
              ? arcCopy.names[arc.lengthDays]
              : arcCopy.fallbackName;
        const dates = copy.dates(
          commonCopy.dayLabel(arc.startDay, today),
          commonCopy.dayLabel(arc.endDay, today),
        );
        const outcome = arc.kind === 'ludus' ? null : arc.status === 'finished' ? copy.finished : copy.ended;
        const done = copy.done(arc.completedDays, arc.conqueredDays);
        return (
          <View
            key={arc.id}
            style={[styles.row, index > 0 && styles.divider]}
            accessible
            accessibilityLabel={[name, dates, outcome, done].filter(Boolean).join(', ')}
          >
            <View style={styles.titleRow}>
              <Txt variant="label" style={styles.name}>
                {name}
              </Txt>
              {outcome ? (
                <Txt variant="micro" color={arc.status === 'finished' ? 'accent' : 'textMuted'}>
                  {outcome}
                </Txt>
              ) : null}
            </View>
            <Txt variant="caption">{dates}</Txt>
            <Txt variant="caption" color="text">
              {done}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  list: { borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  row: { padding: theme.layout.cardPadding, gap: theme.space.xxs },
  divider: { borderTopWidth: theme.layout.hairline, borderTopColor: theme.colors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  name: { flex: 1 },
}));
