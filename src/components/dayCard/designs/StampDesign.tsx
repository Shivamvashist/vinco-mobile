import { View } from 'react-native';

import { dayCardCopy } from '@/copy';
import { toRoman } from '@/lib/toRoman';
import { createStyles } from '@/theme';

import { CardTxt, eyebrowFor, FADED, Wordmark } from './parts';
import type { DayCardDesignProps } from './types';

/** The conquered stamp lands at an angle; a held day gets a straight, quieter seal. */
const SLAM_ANGLE = '-12deg';

/**
 * Stamp: the VINCO seal slammed across a ghosted day number, and one word underneath: "VICI."
 * (I conquered). A day held at the minimum never gets the slam: a straight single-ruled "HELD"
 * seal and "STETI." (I stood firm), matching the quieter seal in the app.
 */
export function StampDesign(props: DayCardDesignProps) {
  const { dayNumber, result = 'held', cardStyle } = props;
  const styles = useStyles();
  const copy = dayCardCopy.stamp[result];
  const isConquered = result === 'conquered';
  const ink = { borderColor: cardStyle.accent };
  const ghostSize = dayNumber >= 100 ? 150 : 210;

  return (
    <View style={styles.body}>
      <CardTxt ink={cardStyle.foreground} size={12} tracking={2.4} style={styles.faded}>
        {eyebrowFor(props)}
      </CardTxt>

      <View style={styles.middle}>
        <CardTxt
          ink={cardStyle.foreground}
          size={ghostSize}
          leading={Math.round(ghostSize * 1.05)}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.ghost}
        >
          {dayNumber}
        </CardTxt>
        <View style={styles.stampLayer} pointerEvents="none">
          <View style={[styles.stamp, ink, isConquered ? styles.stampSlammed : styles.stampQuiet]}>
            <View style={[styles.stampInner, ink, !isConquered && styles.stampInnerQuiet]}>
              <CardTxt ink={cardStyle.accent} size={34} leading={40} tracking={6}>
                {copy.mark}
              </CardTxt>
              <CardTxt ink={cardStyle.accent} size={10} tracking={3} face="bodySemiBold">
                {dayCardCopy.inscription.day(toRoman(dayNumber))}
              </CardTxt>
            </View>
          </View>
        </View>
      </View>

      <CardTxt ink={cardStyle.foreground} size={40} leading={46} tracking={4}>
        {copy.word}
      </CardTxt>
      <CardTxt ink={cardStyle.foreground} size={13} face="bodyMedium" style={styles.faded}>
        {copy.label}
      </CardTxt>
      {isConquered ? null : (
        <View style={styles.wordmark}>
          <Wordmark ink={cardStyle.accent} size={13} />
        </View>
      )}
    </View>
  );
}

const useStyles = createStyles(() => ({
  body: { flex: 1, alignItems: 'center', paddingTop: 40, paddingBottom: 34, paddingHorizontal: 18 },
  faded: { opacity: FADED },
  middle: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  ghost: { opacity: 0.12 },
  stampLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamp: { borderWidth: 4, borderRadius: 10, padding: 4 },
  stampSlammed: { transform: [{ rotate: SLAM_ANGLE }] },
  stampQuiet: { borderWidth: 2, opacity: 0.85 },
  stampInner: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    alignItems: 'center',
  },
  stampInnerQuiet: { borderWidth: 0 },
  wordmark: { marginTop: 18 },
}));
