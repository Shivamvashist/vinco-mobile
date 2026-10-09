import { forwardRef } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { dayCardCopy } from '@/copy';
import { toRoman } from '@/lib/toRoman';
import { createStyles, type DayCardStyle } from '@/theme';

import { Laurel } from '../Laurel';
import { Txt } from '../Txt';

export type DayCardRow = { label: string; value: string; isDone: boolean };

export type DayCardProps = {
  dayNumber: number;
  lengthDays: number;
  rows: readonly DayCardRow[];
  campaign: number;
  rankName: string | null;
  cardStyle: DayCardStyle;
};

const CARD_WIDTH = 270;
const CARD_HEIGHT = 480;
const TICK_SIZE = 18;

/**
 * The shareable day card: laurel, "DAY XII OF LX", the day number, today's orders, campaign and rank.
 * Uses its own fixed palette so a shared card looks the same on every phone. The ref is for capture.
 */
export const DayCard = forwardRef<View, DayCardProps>(function DayCard(
  { dayNumber, lengthDays, rows, campaign, rankName, cardStyle },
  ref,
) {
  const styles = useStyles();
  const ink = { color: cardStyle.foreground };
  const heldCount = rows.filter((row) => row.isDone).length;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { backgroundColor: cardStyle.background }]}
      accessible
      accessibilityLabel={dayCardCopy.cardLabel(toRoman(dayNumber), toRoman(lengthDays), heldCount)}
    >
      <Laurel width={96} strokeColor={cardStyle.accent} strokeWidth={1.6} />
      <Txt variant="eyebrow" style={[styles.eyebrow, ink]}>
        {dayCardCopy.eyebrow(toRoman(dayNumber), toRoman(lengthDays))}
      </Txt>
      <Txt variant="numeral" style={ink}>
        {dayNumber}
      </Txt>

      <View style={styles.rows}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <View
              style={[
                styles.tick,
                row.isDone
                  ? { backgroundColor: cardStyle.accent }
                  : { borderColor: cardStyle.accent, borderWidth: 1.5 },
              ]}
            >
              {row.isDone ? (
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke={cardStyle.onAccent}
                    strokeWidth={3.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              ) : null}
            </View>
            <Txt variant="body" style={[styles.rowLabel, ink]}>
              {row.label}
            </Txt>
            <Txt variant="body" style={[ink, styles.faded]}>
              {row.value}
            </Txt>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Txt variant="micro" style={[ink, styles.faded]}>
          {dayCardCopy.campaign(campaign)}
        </Txt>
        {rankName ? (
          <Txt variant="micro" style={[ink, styles.faded]}>
            {dayCardCopy.rank(rankName)}
          </Txt>
        ) : null}
      </View>
      <Txt variant="headingSmall" style={[styles.wordmark, { color: cardStyle.accent }]}>
        {dayCardCopy.wordmark}
      </Txt>
    </View>
  );
});

const useStyles = createStyles((theme) => ({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: theme.space.xxl + theme.space.xxs,
    paddingHorizontal: theme.space.xl + theme.space.xxs,
    borderRadius: theme.radius.lg - theme.space.xxs,
  },
  eyebrow: { marginTop: theme.space.md, letterSpacing: 2.4 },
  rows: { alignSelf: 'stretch', marginTop: theme.space.lg, gap: theme.space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  tick: {
    width: TICK_SIZE,
    height: TICK_SIZE,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1 },
  faded: { opacity: 0.75 },
  footer: { marginTop: 'auto', alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between' },
  wordmark: { marginTop: theme.space.md, letterSpacing: 5 },
}));
