import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { dayCardCopy } from '@/copy';
import { pickByDay } from '@/features/dayCard';
import { DEFAULT_TONE } from '@/features/tone';
import { toRoman } from '@/lib/toRoman';
import { createStyles } from '@/theme';

import { CardTxt, FADED, Wordmark } from './parts';
import { CARD_HEIGHT, CARD_WIDTH, type DayCardDesignProps } from './types';

/**
 * Memento (remember): one line worth keeping, set large in the lower half, and almost nothing else.
 * The line follows the tone and the result (held or conquered) and changes day by day.
 */
export function MementoDesign({
  dayNumber,
  lengthDays,
  isLudus,
  result = 'held',
  tone = DEFAULT_TONE,
  cardStyle,
}: DayCardDesignProps) {
  const styles = useStyles();
  const line = pickByDay(dayCardCopy.mementoLines[tone][result], dayNumber) ?? '';

  return (
    <View style={styles.body}>
      <Svg
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessible={false}
      >
        <Circle
          cx={CARD_WIDTH - 20}
          cy={96}
          r={132}
          stroke={cardStyle.accent}
          strokeOpacity={0.16}
          fill="none"
        />
        <Circle
          cx={CARD_WIDTH - 20}
          cy={96}
          r={96}
          stroke={cardStyle.accent}
          strokeOpacity={0.09}
          fill="none"
        />
      </Svg>

      <View style={styles.top}>
        <CardTxt ink={cardStyle.accent} size={22} tracking={2}>
          {toRoman(dayNumber)}
        </CardTxt>
        <View style={[styles.topRule, { backgroundColor: cardStyle.accent }]} />
      </View>

      <View style={styles.middle}>
        <CardTxt ink={cardStyle.foreground} size={31} leading={39} numberOfLines={4} adjustsFontSizeToFit>
          {line}
        </CardTxt>
        <View style={[styles.bar, { backgroundColor: cardStyle.accent }]} />
      </View>

      <View style={styles.bottom}>
        <Wordmark ink={cardStyle.accent} size={13} />
        <CardTxt ink={cardStyle.foreground} size={13} face="bodyMedium" style={styles.faded}>
          {dayCardCopy.dayCount(dayNumber, isLudus ? null : lengthDays)}
        </CardTxt>
      </View>
    </View>
  );
}

const useStyles = createStyles(() => ({
  body: { flex: 1, paddingTop: 40, paddingBottom: 30, paddingHorizontal: 30 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topRule: { width: 28, height: 1.5 },
  middle: { flex: 1, justifyContent: 'flex-end', paddingBottom: 64 },
  bar: { width: 36, height: 2, marginTop: 22 },
  faded: { opacity: FADED },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
}));
