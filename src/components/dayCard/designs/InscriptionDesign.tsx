import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { dayCardCopy } from '@/copy';
import { toRoman } from '@/lib/toRoman';
import { createStyles } from '@/theme';

import { CardTxt, FADED, Wordmark } from './parts';
import type { DayCardDesignProps } from './types';

const TABLET_WIDTH = 232;
const TABLET_HEIGHT = 104;
const EAR = 28;
const MARK_SIZE = 7;

/**
 * Inscription (tablet): a Roman "tabula ansata", the dovetailed stone plaque, cut with "DIES XII".
 * "VENI · VIDI · VICI" above, one short line below, orders as interpuncts. Carved double frame.
 */
export function InscriptionDesign({ dayNumber, rows, result = 'held', cardStyle }: DayCardDesignProps) {
  const styles = useStyles();
  const line = { borderColor: cardStyle.foreground };
  const copy = dayCardCopy.inscription;

  return (
    <View style={styles.body}>
      <View style={[styles.frameOuter, line]} pointerEvents="none" />
      <View style={[styles.frameInner, line]} pointerEvents="none" />

      <CardTxt ink={cardStyle.foreground} size={13} tracking={3.5}>
        {copy.motto}
      </CardTxt>
      <Divider color={cardStyle.accent} />

      <View style={styles.middle}>
        <View style={styles.tablet}>
          <Svg width={TABLET_WIDTH} height={TABLET_HEIGHT} viewBox={`0 0 ${TABLET_WIDTH} ${TABLET_HEIGHT}`}>
            <TabulaAnsata color={cardStyle.accent} />
          </Svg>
          <View style={styles.tabletText} pointerEvents="none">
            <CardTxt
              ink={cardStyle.foreground}
              size={30}
              leading={36}
              tracking={3}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {copy.day(toRoman(dayNumber))}
            </CardTxt>
          </View>
        </View>

        {rows.length > 0 ? (
          <View style={styles.marks}>
            {rows.map((row, index) => (
              <View
                key={`${index}-${row.label}`}
                style={[
                  styles.mark,
                  row.isDone
                    ? { backgroundColor: cardStyle.accent }
                    : [styles.markOpen, { borderColor: cardStyle.foreground }],
                ]}
              />
            ))}
          </View>
        ) : null}
        <CardTxt ink={cardStyle.foreground} size={15} face="bodyMedium" style={styles.line}>
          {copy.line[result]}
        </CardTxt>
      </View>

      <Divider color={cardStyle.accent} />
      <Wordmark ink={cardStyle.accent} />
    </View>
  );
}

/** The plaque: a double-ruled tablet with a dovetail handle on each side, each with a nail hole. */
function TabulaAnsata({ color }: { color: string }) {
  const top = 6;
  const bottom = TABLET_HEIGHT - 6;
  const mid = TABLET_HEIGHT / 2;
  const left = EAR;
  const right = TABLET_WIDTH - EAR;
  return (
    <>
      <Rect
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
      <Rect
        x={left + 6}
        y={top + 6}
        width={right - left - 12}
        height={bottom - top - 12}
        stroke={color}
        strokeOpacity={0.55}
        strokeWidth={0.9}
        fill="none"
      />
      <Path
        d={`M${left} ${mid} L3 ${mid - 26} L3 ${mid + 26}Z`}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
      <Path
        d={`M${right} ${mid} L${TABLET_WIDTH - 3} ${mid - 26} L${TABLET_WIDTH - 3} ${mid + 26}Z`}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
      <Circle cx={11} cy={mid} r={2.4} fill={color} />
      <Circle cx={TABLET_WIDTH - 11} cy={mid} r={2.4} fill={color} />
    </>
  );
}

/** A carved rule with a diamond at its centre. */
function Divider({ color }: { color: string }) {
  return (
    <Svg width={120} height={14} viewBox="0 0 120 14" style={{ marginVertical: 14 }}>
      <Path d="M4 7 H50 M70 7 H116" stroke={color} strokeWidth={1} strokeOpacity={0.7} />
      <Path d="M60 2 L65 7 L60 12 L55 7Z" fill={color} />
    </Svg>
  );
}

const useStyles = createStyles(() => ({
  body: { flex: 1, alignItems: 'center', paddingTop: 44, paddingBottom: 40, paddingHorizontal: 20 },
  frameOuter: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 1,
    opacity: 0.35,
  },
  frameInner: {
    position: 'absolute',
    top: 17,
    left: 17,
    right: 17,
    bottom: 17,
    borderWidth: 0.6,
    opacity: 0.25,
  },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tablet: { width: TABLET_WIDTH, height: TABLET_HEIGHT },
  tabletText: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: EAR + 14,
    right: EAR + 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marks: { flexDirection: 'row', gap: 10, marginTop: 22 },
  mark: { width: MARK_SIZE, height: MARK_SIZE, transform: [{ rotate: '45deg' }] },
  markOpen: { borderWidth: 1.2, opacity: 0.5 },
  line: { marginTop: 18, opacity: FADED },
}));
