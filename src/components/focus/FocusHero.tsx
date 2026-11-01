import { useState } from 'react';
import { type LayoutChangeEvent, useWindowDimensions, View } from 'react-native';

import { ProgressRing } from '@/components/ProgressRing';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { createStyles, useTheme } from '@/theme';

import { FocusClock } from './FocusClock';

export type FocusHeroProps = {
  remainingMs: number;
  /** Share of the focus still to go: 1 at the start, 0 at the end. */
  remainingShare: number;
  /** "Ends 7:40 pm · Limit". */
  meta: string;
};

/**
 * The digits' size as a share of the ring: "1:30" with its seconds is about 2.6 digits wide, and
 * must sit inside the ring's inner width with room to spare.
 */
const CLOCK_SHARE = 0.27;
/** The meta line stays inside the ring's inner chord. */
const META_SHARE = 0.68;
/** Before the box is measured (the first frame), a ring this share of the window height at most. */
const FIRST_HEIGHT_SHARE = 0.38;

/**
 * The running focus's hero: a ring that drains as the time runs out, the time left large inside
 * it, and one small line (when it ends, the guard). It takes all the height it is given and
 * sizes itself to the smaller side, so it fills small and tall phones alike without clipping.
 */
export function FocusHero({ remainingMs, remainingShare, meta }: FocusHeroProps) {
  const theme = useTheme();
  const styles = useStyles();
  const window = useWindowDimensions();
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  // Measured: the smaller side of the box. Until then, an estimate from the window, so the time
  // shows from the first frame (and for screen readers) with no jump worth seeing.
  const diameter = Math.max(
    0,
    Math.floor(
      box
        ? Math.min(box.width, box.height)
        : Math.min(window.width - theme.layout.flowGutter * 2, window.height * FIRST_HEIGHT_SHARE),
    ),
  );
  const percentDone = Math.round((1 - remainingShare) * 100);

  return (
    <View
      style={styles.box}
      onLayout={(event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setBox({ width, height });
      }}
    >
      {diameter > 0 ? (
        <ProgressRing
          value={remainingShare}
          size={diameter}
          strokeWidth={theme.layout.ringStrokeWidth}
          accessibilityLabel={focusCopy.active.progressLabel(percentDone)}
        >
          <View style={styles.centre}>
            <FocusClock remainingMs={remainingMs} fontSize={Math.round(diameter * CLOCK_SHARE)} />
            <Txt
              variant="caption"
              align="center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={{ maxWidth: diameter * META_SHARE }}
            >
              {meta}
            </Txt>
          </View>
        </ProgressRing>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: theme.space.giant * 2 },
  centre: { alignItems: 'center', gap: theme.space.xxs },
}));
