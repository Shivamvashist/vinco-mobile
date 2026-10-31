import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import type { DayCardDesignId } from '@/features/dayCard';
import type { DayCardStyle } from '@/theme';

import { CARD_HEIGHT, CARD_WIDTH } from './types';

/** The thumbnail is drawn at a tenth of the card. */
const W = CARD_WIDTH / 10;
const H = CARD_HEIGHT / 10;

export type DesignThumbProps = {
  designId: DayCardDesignId;
  cardStyle: DayCardStyle;
  width: number;
};

/** A tiny sketch of a card design in a colour style, for the picker and the Forum. Decorative. */
export function DesignThumb({ designId, cardStyle, width }: DesignThumbProps) {
  return (
    <Svg
      width={width}
      height={(width * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Rect
        x={0.5}
        y={0.5}
        width={W - 1}
        height={H - 1}
        rx={2}
        fill={cardStyle.background}
        stroke={cardStyle.frame ?? cardStyle.background}
      />
      <Sketch designId={designId} accent={cardStyle.accent} ink={cardStyle.foreground} />
    </Svg>
  );
}

function Sketch({ designId, accent, ink }: { designId: DayCardDesignId; accent: string; ink: string }) {
  const cx = W / 2;
  switch (designId) {
    case 'numeral':
      return (
        <>
          <Path d="M7 14 L14 28 M14 14 L7 28" stroke={accent} strokeWidth={1.6} />
          <Path d="M17 14 V28 M21 14 V28" stroke={accent} strokeWidth={1.6} />
          <Path d="M9 33 V36 M12 33 V36 M15 33 V36 M18 33 V36" stroke={ink} strokeWidth={0.9} />
          <Line x1={4} y1={42} x2={W - 4} y2={42} stroke={ink} strokeOpacity={0.4} strokeWidth={0.4} />
        </>
      );
    case 'laurel':
      return (
        <>
          <Path
            d={`M${cx - 1} 30 A9 9 0 1 1 ${cx + 1} 30`}
            stroke={accent}
            strokeWidth={2.2}
            fill="none"
            strokeDasharray="1.6 0.8"
          />
          <Rect x={cx - 2.5} y={19} width={5} height={3} rx={0.6} fill={ink} />
          <Line x1={9} y1={40} x2={W - 9} y2={40} stroke={ink} strokeOpacity={0.5} strokeWidth={0.8} />
        </>
      );
    case 'sol':
      return (
        <>
          {[200, 225, 250, 270, 290, 315, 340].map((angle) => {
            const a = (angle * Math.PI) / 180;
            return (
              <Line
                key={angle}
                x1={cx + 6 * Math.cos(a)}
                y1={24 + 6 * Math.sin(a)}
                x2={cx + 11 * Math.cos(a)}
                y2={24 + 11 * Math.sin(a)}
                stroke={accent}
                strokeWidth={0.8}
              />
            );
          })}
          <Path d={`M${cx - 4.5} 24 A4.5 4.5 0 0 1 ${cx + 4.5} 24Z`} fill={accent} />
          <Line x1={3} y1={24} x2={W - 3} y2={24} stroke={ink} strokeOpacity={0.6} strokeWidth={0.5} />
          <Rect x={cx - 3} y={30} width={6} height={4} rx={0.6} fill={ink} />
        </>
      );
    case 'inscription':
      return (
        <>
          <Rect
            x={2.5}
            y={2.5}
            width={W - 5}
            height={H - 5}
            stroke={ink}
            strokeOpacity={0.35}
            strokeWidth={0.4}
            fill="none"
          />
          <Rect x={7} y={19} width={13} height={8} stroke={accent} strokeWidth={0.8} fill="none" />
          <Path
            d="M7 23 L3.5 20.5 V25.5Z M20 23 L23.5 20.5 V25.5Z"
            stroke={accent}
            strokeWidth={0.7}
            fill="none"
          />
          <Line x1={9.5} y1={23} x2={17.5} y2={23} stroke={ink} strokeWidth={1.2} />
          <Line x1={8} y1={9} x2={W - 8} y2={9} stroke={ink} strokeOpacity={0.6} strokeWidth={0.8} />
        </>
      );
    case 'stamp':
      return (
        <>
          <Rect x={cx - 4} y={14} width={8} height={11} rx={0.8} fill={ink} fillOpacity={0.14} />
          <Rect
            x={4}
            y={16}
            width={W - 8}
            height={7}
            rx={1}
            stroke={accent}
            strokeWidth={1.1}
            fill="none"
            transform={`rotate(-12 ${cx} 19.5)`}
          />
          <Line x1={8} y1={36} x2={W - 8} y2={36} stroke={ink} strokeWidth={1.6} />
        </>
      );
    case 'memento':
      return (
        <>
          <Circle
            cx={W - 2}
            cy={10}
            r={13}
            stroke={accent}
            strokeOpacity={0.25}
            strokeWidth={0.5}
            fill="none"
          />
          <Line x1={3.5} y1={5} x2={7} y2={5} stroke={accent} strokeWidth={1.1} />
          <Path d="M3.5 26 H22 M3.5 29.5 H19 M3.5 33 H14" stroke={ink} strokeWidth={1.4} />
          <Line x1={3.5} y1={37} x2={7} y2={37} stroke={accent} strokeWidth={0.6} />
        </>
      );
    case 'classic':
      return (
        <>
          <Path d={`M${cx - 6} 4 Q${cx} 7.5 ${cx + 6} 4`} stroke={accent} strokeWidth={0.7} fill="none" />
          <Rect x={cx - 3} y={9} width={6} height={6} rx={0.6} fill={ink} />
          {[20, 24, 28, 32].map((y) => (
            <Path
              key={y}
              d={`M4 ${y} H5.6 M7.5 ${y} H${W - 6}`}
              stroke={y === 32 ? ink : accent}
              strokeWidth={1}
            />
          ))}
          <Line x1={9} y1={43} x2={W - 9} y2={43} stroke={accent} strokeWidth={0.9} />
        </>
      );
  }
}
