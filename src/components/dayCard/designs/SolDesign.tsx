import { View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { createStyles } from '@/theme';

import { polar, rayAngles } from './geometry';
import { CardTxt, eyebrowFor, FADED, Wordmark } from './parts';
import { CARD_WIDTH, type DayCardDesignProps } from './types';

const HEIGHT = 232;
const HORIZON = 196;
const CX = CARD_WIDTH / 2;
const SUN = 40;
const RAY_FROM = SUN + 14;
const RAY_DONE = 126;
const RAY_OPEN = 78;
/** With no orders the sun still rises, with quiet rays. */
const DECORATIVE_RAYS = 9;
const REFLECTIONS = [
  { y: 207, half: 34, opacity: 0.7 },
  { y: 216, half: 22, opacity: 0.45 },
  { y: 225, half: 11, opacity: 0.25 },
];

/**
 * Sol (sunrise): the day rising over the horizon. Each order is a ray, long and gold when done,
 * short and dotted when not. The day number sits below the horizon, under the sun's reflection.
 */
export function SolDesign(props: DayCardDesignProps) {
  const { dayNumber, rows, cardStyle } = props;
  const styles = useStyles();
  const hasOrders = rows.length > 0;
  const angles = rayAngles(hasOrders ? rows.length : DECORATIVE_RAYS);

  return (
    <View style={styles.body}>
      <CardTxt ink={cardStyle.foreground} size={12} tracking={2.4} style={styles.eyebrow}>
        {eyebrowFor(props)}
      </CardTxt>

      <Svg width={CARD_WIDTH} height={HEIGHT} viewBox={`0 0 ${CARD_WIDTH} ${HEIGHT}`} style={styles.sky}>
        {angles.map((angle, index) => {
          const isDone = hasOrders && (rows[index]?.isDone ?? false);
          const from = polar(CX, HORIZON, RAY_FROM, angle);
          const to = polar(CX, HORIZON, isDone ? RAY_DONE : RAY_OPEN, angle);
          return (
            <Line
              key={`${index}-${angle}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isDone ? cardStyle.accent : cardStyle.foreground}
              strokeOpacity={isDone ? 1 : 0.45}
              strokeWidth={isDone ? 3 : 1.6}
              strokeDasharray={isDone ? undefined : '1 6'}
              strokeLinecap="round"
            />
          );
        })}
        <Path
          d={`M${CX - SUN - 8} ${HORIZON} A${SUN + 8} ${SUN + 8} 0 0 1 ${CX + SUN + 8} ${HORIZON}`}
          stroke={cardStyle.accent}
          strokeOpacity={0.45}
          strokeWidth={1}
          fill="none"
        />
        <Path
          d={`M${CX - SUN} ${HORIZON} A${SUN} ${SUN} 0 0 1 ${CX + SUN} ${HORIZON}Z`}
          fill={cardStyle.accent}
        />
        <Line
          x1={22}
          y1={HORIZON}
          x2={CARD_WIDTH - 22}
          y2={HORIZON}
          stroke={cardStyle.foreground}
          strokeOpacity={0.55}
          strokeWidth={1}
        />
        {REFLECTIONS.map(({ y, half, opacity }) => (
          <Line
            key={y}
            x1={CX - half}
            y1={y}
            x2={CX + half}
            y2={y}
            stroke={cardStyle.accent}
            strokeOpacity={opacity}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
      </Svg>

      <CardTxt ink={cardStyle.foreground} size={76} leading={84} numberOfLines={1} adjustsFontSizeToFit>
        {dayNumber}
      </CardTxt>
      <View style={styles.bottom}>
        <Wordmark ink={cardStyle.accent} />
      </View>
    </View>
  );
}

const useStyles = createStyles(() => ({
  body: { flex: 1, alignItems: 'center', paddingTop: 38, paddingBottom: 30 },
  eyebrow: { opacity: FADED, paddingHorizontal: 20 },
  sky: { marginTop: 18 },
  bottom: { marginTop: 'auto' },
}));
