import { View } from 'react-native';

import { pickTone, rewardsCopy } from '@/copy';
import { type DayGloria, gloriaParts, type GloriaSource } from '@/features/gloria';
import type { Tone } from '@/features/tone';
import { type ColorRole, createStyles, useTheme } from '@/theme';

import { Card } from '../Card';
import { Txt } from '../Txt';

export type GloriaDayBreakdownProps = {
  /** The day's Gloria by source, or null for a day before the journey began. */
  breakdown: DayGloria | null;
  /** "Today", "Monday 26 October". */
  dayLabel: string;
  tone: Tone;
};

const copy = rewardsCopy.gloriaHistory;
const SOURCE_COLORS: Record<GloriaSource, ColorRole> = {
  orders: 'accent',
  conquered: 'seal',
  todos: 'info',
  focus: 'success',
  claims: 'currency',
};

/** One day's Gloria: the total, a bar split by where it came from, and a row for each source. */
export function GloriaDayBreakdown({ breakdown, dayLabel, tone }: GloriaDayBreakdownProps) {
  const styles = useStyles();
  const theme = useTheme();
  const parts = breakdown ? gloriaParts(breakdown) : [];
  const total = breakdown?.total ?? 0;

  return (
    <Card>
      <View accessible accessibilityLabel={copy.periodTotalLabel(total, dayLabel)}>
        <Txt variant="display" color="accent" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {copy.periodTotal(total)}
        </Txt>
        <Txt variant="micro">{dayLabel}</Txt>
      </View>
      {breakdown == null ? (
        <Txt variant="body" color="textMuted" style={styles.note}>
          {copy.outside}
        </Txt>
      ) : parts.length === 0 ? (
        <Txt variant="body" color="textMuted" style={styles.note}>
          {pickTone(copy.empty, tone)}
        </Txt>
      ) : (
        <>
          <View style={styles.split} importantForAccessibility="no-hide-descendants">
            {parts.map(({ source, value }) => (
              <View
                key={source}
                style={{ flex: value, backgroundColor: theme.colors[SOURCE_COLORS[source]] }}
              />
            ))}
          </View>
          {parts.map((part) => {
            const name = copy.sources[part.source];
            return (
              <View
                key={part.source}
                style={styles.row}
                accessible
                accessibilityLabel={copy.describeSource(name, part.value)}
              >
                <View style={[styles.dot, { backgroundColor: theme.colors[SOURCE_COLORS[part.source]] }]} />
                <Txt variant="caption" color="text" style={styles.name} numberOfLines={1}>
                  {name}
                </Txt>
                <Txt variant="caption" style={styles.tabular}>
                  {copy.periodTotal(part.value)}
                </Txt>
              </View>
            );
          })}
        </>
      )}
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  note: { marginTop: theme.space.md },
  split: {
    flexDirection: 'row',
    height: theme.layout.barHeightThick,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    gap: theme.space.xxs,
    marginTop: theme.space.lg,
    marginBottom: theme.space.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, paddingVertical: theme.space.xxs },
  dot: { width: theme.space.sm, height: theme.space.sm, borderRadius: theme.radius.pill },
  name: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
}));
