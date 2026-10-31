import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { dayCardCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Laurel } from '../../Laurel';
import { Txt } from '../../Txt';
import { campaignLineFor, eyebrowFor } from './parts';
import type { DayCardDesignProps } from './types';

const TICK_SIZE = 18;
/** Above this many orders, rows tighten so up to eight still fit the fixed card. */
const COMPACT_AFTER_ROWS = 5;

/** The original card: laurel, "DAY XII OF LX", the day number, today's orders, campaign and rank. */
export function ClassicDesign(props: DayCardDesignProps) {
  const { dayNumber, rows, rankName, cardStyle } = props;
  const styles = useStyles();
  const ink = { color: cardStyle.foreground };
  const isCompact = rows.length > COMPACT_AFTER_ROWS;
  const rowVariant = isCompact ? 'caption' : 'body';

  return (
    <View style={styles.body}>
      <Laurel width={96} strokeColor={cardStyle.accent} strokeWidth={1.6} />
      <Txt variant="eyebrow" style={[styles.eyebrow, ink]}>
        {eyebrowFor(props)}
      </Txt>
      <Txt variant="numeral" style={ink}>
        {dayNumber}
      </Txt>

      <View style={[styles.rows, isCompact && styles.rowsCompact]}>
        {rows.map((row, index) => (
          <View key={`${index}-${row.label}`} style={styles.row}>
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
            <Txt variant={rowVariant} numberOfLines={1} style={[styles.rowLabel, ink]}>
              {row.label}
            </Txt>
            <Txt variant={rowVariant} numberOfLines={1} style={[ink, styles.faded]}>
              {row.value}
            </Txt>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Txt variant="micro" style={[ink, styles.faded]}>
          {campaignLineFor(props)}
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
}

const useStyles = createStyles((theme) => ({
  body: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.space.xxl + theme.space.xxs,
    paddingHorizontal: theme.space.xl + theme.space.xxs,
  },
  eyebrow: { marginTop: theme.space.md, letterSpacing: 2.4 },
  rows: { alignSelf: 'stretch', marginTop: theme.space.lg, gap: theme.space.sm },
  rowsCompact: { marginTop: theme.space.md, gap: theme.space.xs },
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
