import { View } from 'react-native';

import { dayCardCopy } from '@/copy';
import { layoutNumeral } from '@/features/dayCard';
import { createStyles } from '@/theme';

import { CardTxt, FADED, Wordmark } from './parts';
import { CARD_WIDTH, type DayCardDesignProps } from './types';

const SIDE = 26;
const TRACKING_EM = 0.04;
/** Room for the numeral, a little inside the margins so wide letters never touch the edge. */
const NUMERAL_WIDTH = CARD_WIDTH - SIDE * 2 - 8;

/**
 * Numeral: the day carved as one huge Roman numeral in gold, split into tens over units when that
 * sets it larger. Orders sit beneath as tally strokes. Only "DIES" (day) and the count as text.
 */
export function NumeralDesign({ dayNumber, lengthDays, isLudus, rows, cardStyle }: DayCardDesignProps) {
  const styles = useStyles();
  const { lines, fontSize } = layoutNumeral(dayNumber, NUMERAL_WIDTH, TRACKING_EM);
  const rule = [styles.rule, { backgroundColor: cardStyle.foreground }];

  return (
    <View style={styles.body}>
      <View style={styles.top}>
        <View style={rule} />
        <CardTxt ink={cardStyle.foreground} size={12} tracking={5} style={styles.faded}>
          {dayCardCopy.dies}
        </CardTxt>
        <View style={rule} />
      </View>

      <View style={styles.middle}>
        {lines.map((line) => (
          <CardTxt
            key={line}
            ink={cardStyle.accent}
            size={fontSize}
            leading={Math.round(fontSize * 1.08)}
            tracking={fontSize * TRACKING_EM}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={styles.numeral}
          >
            {line}
          </CardTxt>
        ))}
        {rows.length > 0 ? (
          <View style={styles.tally}>
            {rows.map((row, index) => (
              <View
                key={`${index}-${row.label}`}
                style={[
                  styles.stroke,
                  row.isDone
                    ? { backgroundColor: cardStyle.accent }
                    : [styles.strokeOpen, { borderColor: cardStyle.foreground }],
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>

      <View style={[styles.rule, styles.ruleFull, { backgroundColor: cardStyle.foreground }]} />
      <View style={styles.bottom}>
        <Wordmark ink={cardStyle.accent} />
        <CardTxt ink={cardStyle.foreground} size={13} face="bodyMedium" style={styles.faded}>
          {dayCardCopy.dayCount(dayNumber, isLudus ? null : lengthDays)}
        </CardTxt>
      </View>
    </View>
  );
}

const useStyles = createStyles(() => ({
  body: { flex: 1, paddingHorizontal: SIDE, paddingTop: 30, paddingBottom: 24 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: 1, opacity: 0.3 },
  ruleFull: { flex: 0, alignSelf: 'stretch' },
  faded: { opacity: FADED },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  numeral: { textAlign: 'center', alignSelf: 'stretch' },
  tally: { flexDirection: 'row', gap: 9, marginTop: 22 },
  stroke: { width: 5, height: 26, borderRadius: 2.5 },
  strokeOpen: { borderWidth: 1.5, opacity: 0.45 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14 },
}));
