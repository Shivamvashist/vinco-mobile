import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { createStyles } from '@/theme';

import { spreadAngles, polar, wreath } from './geometry';
import { campaignLineFor, CardTxt, eyebrowFor, FADED, Wordmark } from './parts';
import type { DayCardDesignProps } from './types';

const SIZE = 232;
const CENTRE = SIZE / 2;
const RADIUS = 96;
const WREATH = wreath(CENTRE, CENTRE, RADIUS);
/** Orders hang as berries inside the bottom of the wreath, this far in and apart. */
const BERRY_INSET = 17;
const BERRY_GAP = 11;
const BERRY_RADIUS = 4;
const BERRY_SPAN = 72;

/**
 * Laurel: a full victor's wreath encircling the day number. Each order is a berry inside the
 * wreath, gold when done. "DAY XII OF LX" above, the campaign below.
 */
export function LaurelDesign(props: DayCardDesignProps) {
  const { dayNumber, rows, cardStyle } = props;
  const styles = useStyles();
  // Many orders sit closer so the berries stay in the bottom of the wreath, clear of the number.
  const berries = spreadAngles(
    rows.length,
    90,
    Math.min(BERRY_GAP, BERRY_SPAN / Math.max(1, rows.length - 1)),
  );
  const numberSize = dayNumber >= 100 ? 70 : 96;

  return (
    <View style={styles.body}>
      <CardTxt ink={cardStyle.foreground} size={12} tracking={2.4} style={styles.faded}>
        {eyebrowFor(props)}
      </CardTxt>

      <View style={styles.wreath}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} fill="none">
          {WREATH.stems.map((d) => (
            <Path key={d} d={d} stroke={cardStyle.accent} strokeWidth={1.6} strokeLinecap="round" />
          ))}
          {WREATH.leaves.map((d) => (
            <Path key={d} d={d} fill={cardStyle.accent} />
          ))}
          {berries.map((angle, index) => {
            const point = polar(CENTRE, CENTRE, RADIUS - BERRY_INSET, angle);
            const isDone = rows[index]?.isDone ?? false;
            return (
              <Circle
                key={`${index}-${angle}`}
                cx={point.x}
                cy={point.y}
                r={BERRY_RADIUS}
                fill={isDone ? cardStyle.accent : 'none'}
                stroke={isDone ? 'none' : cardStyle.foreground}
                strokeOpacity={0.5}
                strokeWidth={1.4}
              />
            );
          })}
        </Svg>
        <View style={styles.numberWrap} pointerEvents="none">
          <CardTxt
            ink={cardStyle.foreground}
            size={numberSize}
            leading={Math.round(numberSize * 1.1)}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {dayNumber}
          </CardTxt>
        </View>
      </View>

      <CardTxt ink={cardStyle.foreground} size={14} face="bodyMedium" style={styles.campaign}>
        {campaignLineFor(props)}
      </CardTxt>
      <View style={styles.bottom}>
        <Wordmark ink={cardStyle.accent} />
      </View>
    </View>
  );
}

const useStyles = createStyles(() => ({
  body: { flex: 1, alignItems: 'center', paddingTop: 40, paddingBottom: 30, paddingHorizontal: 20 },
  faded: { opacity: FADED },
  wreath: { width: SIZE, height: SIZE, marginTop: 34 },
  numberWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 44,
    paddingBottom: 10,
  },
  campaign: { marginTop: 26, opacity: FADED },
  bottom: { marginTop: 'auto' },
}));
