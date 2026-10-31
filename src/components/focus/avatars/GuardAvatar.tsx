import Svg, { Circle, G, Path } from 'react-native-svg';

import type { FocusGuard } from '@/features/focus';
import { useTheme } from '@/theme';

export type GuardAvatarProps = {
  guard: FocusGuard;
  /** Selected emblems are drawn in the accent; the others in muted ink. */
  isSelected: boolean;
  size: number;
};

type EmblemProps = { ink: string; fill: string; mark: string };

/**
 * The guard's emblem, drawn in code from palette roles so it follows every palette: Custos an open
 * helmet with a watchful eye, Imperium a centurion's crested helmet, Silentium a closed helm.
 * Decorative: the card around it names the guard.
 */
export function GuardAvatar({ guard, isSelected, size }: GuardAvatarProps) {
  const theme = useTheme();
  const ink = isSelected ? theme.colors.accent : theme.colors.textMuted;
  const fill = isSelected ? theme.colors.accentTint : theme.colors.surfaceSunk;
  const mark = isSelected ? theme.colors.accent : theme.colors.borderStrong;
  const Emblem = EMBLEMS[guard];
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" importantForAccessibility="no-hide-descendants">
      <Emblem ink={ink} fill={fill} mark={mark} />
    </Svg>
  );
}

const STROKE = { strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Level I, "Watch": an open-faced helmet with an eye on its brow, keeping watch. */
function CustosEmblem({ ink, fill, mark }: EmblemProps) {
  return (
    <G>
      <Path
        d="M15 46 C14 27 21 14 32 14 C43 14 50 27 49 46 L42 46 L41 37 C38 35 26 35 23 37 L22 46 Z"
        fill={fill}
        stroke={ink}
        {...STROKE}
      />
      <Path d="M17 33 C26 30 38 30 47 33" fill="none" stroke={mark} {...STROKE} />
      <Path d="M23 24 Q32 16.5 41 24 Q32 31.5 23 24 Z" fill="none" stroke={ink} {...STROKE} />
      <Circle cx={32} cy={24} r={2.8} fill={ink} />
      <Path d="M22 46 L19 51 M42 46 L45 51" fill="none" stroke={ink} {...STROKE} />
    </G>
  );
}

/** Level II, "Limit": a centurion's helmet with its crest worn side to side. */
function ImperiumEmblem({ ink, fill, mark }: EmblemProps) {
  return (
    <G>
      <Path d="M11 22 Q32 3 53 22 Q32 13 11 22 Z" fill={mark} stroke={ink} {...STROKE} />
      <Path d="M32 12 L32 19" fill="none" stroke={ink} {...STROKE} />
      <Path
        d="M17 46 C16 31 22 21 32 21 C42 21 48 31 47 46 L40 52 L38 38 L26 38 L24 52 Z"
        fill={fill}
        stroke={ink}
        {...STROKE}
      />
      <Path d="M18 34 C27 31.5 37 31.5 46 34" fill="none" stroke={mark} {...STROKE} />
      <Path d="M32 38 L32 46" fill="none" stroke={ink} {...STROKE} />
    </G>
  );
}

/** Level III, "Lockdown": a closed helm with a narrow sight and breaths, nothing let in. */
function SilentiumEmblem({ ink, fill, mark }: EmblemProps) {
  return (
    <G>
      <Path
        d="M16 20 C16 15 22 11 32 11 C42 11 48 15 48 20 L48 46 C48 51 41 55 32 55 C23 55 16 51 16 46 Z"
        fill={fill}
        stroke={ink}
        {...STROKE}
      />
      <Path d="M21 29 L43 29" fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M32 33 L32 49" fill="none" stroke={mark} {...STROKE} />
      <Circle cx={25} cy={40} r={1.4} fill={ink} />
      <Circle cx={25} cy={45} r={1.4} fill={ink} />
      <Circle cx={39} cy={40} r={1.4} fill={ink} />
      <Circle cx={39} cy={45} r={1.4} fill={ink} />
    </G>
  );
}

const EMBLEMS: Record<FocusGuard, (props: EmblemProps) => React.JSX.Element> = {
  custos: CustosEmblem,
  imperium: ImperiumEmblem,
  silentium: SilentiumEmblem,
};
