import { router } from 'expo-router';
import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { useGuardPermissions } from '@/hooks/useGuardPermissions';
import { useReelCount } from '@/hooks/useReelCount';
import { type ColorRole, createStyles, useFeedback } from '@/theme';

import { ProgressBar } from '../../ProgressBar';
import { RollingNumber } from '../../RollingNumber';
import { Txt } from '../../Txt';
import { HeroTile } from './HeroTile';

/** From this share of the budget the tile warms to the accent. */
const NEAR_SHARE = 0.8;

const copy = todayCopy.tiles.reels;

/** Calm, near the budget, or past it; `off` where reels can't be counted. */
type ReelsMood = 'off' | 'calm' | 'near' | 'over';

/** How today's count sits against the budget. Pure, so the colours are easy to reason about. */
function reelsMood(canCount: boolean, count: number, budget: number): ReelsMood {
  if (!canCount) return 'off';
  if (budget > 0 && count > budget) return 'over';
  return budget > 0 && count / budget >= NEAR_SHARE ? 'near' : 'calm';
}

const MOOD_COLOR: Record<ReelsMood, ColorRole> = {
  off: 'info',
  calm: 'info',
  near: 'accent',
  over: 'danger',
};

/**
 * The Reels tile on Today: reels watched today against the budget, a thin bar that warms to the
 * accent near the budget and turns porphyry past it. Where reels can't be counted (Expo Go, no
 * permission yet) it says "Set up". Either way a tap opens the reel counter.
 */
export function ReelsTile() {
  const styles = useStyles();
  const play = useFeedback();
  const reels = useReelCount();
  const permissions = useGuardPermissions();
  // Counting needs the build's module and the accessibility service on (unknown while it's read:
  // assume on, so a counting phone doesn't flash "Set up").
  const isCounting = reels.canCount && permissions.granted?.accessibility !== false;
  // Against the allowance (budget plus today's passes), as the badge on the phone does.
  const mood = reelsMood(isCounting, reels.today, reels.allowance);
  const color = MOOD_COLOR[mood];

  return (
    <HeroTile
      icon="eye"
      title={copy.title}
      glow={color}
      glowOrigin="bottomLeft"
      isLit={mood === 'near' || mood === 'over'}
      onPress={() => {
        play('tap');
        router.push('/reels');
      }}
      accessibilityLabel={mood === 'off' ? copy.setUpLabel : copy.label(reels.today, reels.allowance)}
      accessibilityHint={copy.hint}
    >
      {mood === 'off' ? (
        <View style={styles.figure}>
          <RollingNumber value={copy.setUp} variant="display" color="textMuted" fit />
        </View>
      ) : (
        <>
          <View style={styles.figure}>
            <RollingNumber
              value={String(reels.today)}
              variant="display"
              color={mood === 'over' ? 'danger' : 'text'}
              fit
            />
            <Txt variant="caption" numberOfLines={1}>
              {copy.of(reels.allowance)}
            </Txt>
          </View>
          <View style={styles.bar}>
            <ProgressBar
              value={reels.allowance > 0 ? Math.min(1, reels.today / reels.allowance) : 0}
              size="thin"
              color={color}
            />
          </View>
        </>
      )}
    </HeroTile>
  );
}

const useStyles = createStyles((theme) => ({
  figure: { marginTop: theme.space.sm },
  bar: { marginTop: theme.space.sm },
}));
