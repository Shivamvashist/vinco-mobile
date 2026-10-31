import { View } from 'react-native';

import { arcCopy, rewardsCopy } from '@/copy';
import type { Decoration, DecorationId } from '@/features/campaign';
import { claimKey, DECORATION_REWARDS, FOREVER_PERIOD, resolveClaimPay } from '@/features/labours';
import type { ClaimOutcome } from '@/hooks/useLabours';
import { cardSurface, createStyles } from '@/theme';

import { Glow } from '../Glow';
import { ClaimButton } from '../hud/ClaimButton';
import { Icon } from '../Icon';
import { RewardChips } from '../labours/RewardChips';
import { ProgressBar } from '../ProgressBar';
import { Txt } from '../Txt';

export type DecorationGridProps = {
  decorations: readonly Decoration[];
  /** Claim keys made so far (claimKey). */
  claimed: ReadonlySet<string>;
  /** Truces held: a Truce reward at the cap pays denarii instead. */
  truceReserve: number;
  onClaim: (id: DecorationId) => ClaimOutcome;
  onProblem: (message: string) => void;
};

const copy = arcCopy.decorations;
const claimCopy = rewardsCopy.decorations;

/**
 * Decorations as achievements, in two columns: earned ones in gold with "Claim +N" until claimed
 * (once, forever), locked ones outlined with how to earn them, their progress where it can be
 * counted, and what they pay. So every locked medal is also a small goal.
 */
export function DecorationGrid({
  decorations,
  claimed,
  truceReserve,
  onClaim,
  onProblem,
}: DecorationGridProps) {
  const styles = useStyles();
  const earned = decorations.filter((decoration) => decoration.isEarned).length;
  return (
    <View>
      <Txt variant="caption">{copy.count(earned, decorations.length)}</Txt>
      <View style={styles.grid}>
        {decorations.map(({ id, isEarned, progress }) => {
          const item = copy.items[id];
          const isClaimed = claimed.has(claimKey('decoration', id, FOREVER_PERIOD));
          const pay = resolveClaimPay(DECORATION_REWARDS[id], truceReserve);
          const reward = rewardsCopy.rewards.describe(pay);
          const status = isEarned ? (isClaimed ? claimCopy.claimed : copy.earned) : item.how;
          return (
            <View key={id} style={[styles.tile, isEarned ? styles.earned : styles.locked]}>
              {isEarned ? (
                <Glow color="accent" intensity={isClaimed ? 0.35 : 0.7} origin="bottomRight" />
              ) : null}
              <View
                style={styles.head}
                accessible
                accessibilityLabel={`${item.name}, ${asSentence(status)} ${claimCopy.pays(reward)}`}
              >
                <Icon name={isClaimed ? 'check' : 'medal'} color={isEarned ? 'accent' : 'textFaint'} />
                <Txt variant="label" color={isEarned ? 'text' : 'textMuted'} numberOfLines={1}>
                  {item.name}
                </Txt>
                <Txt variant="micro" numberOfLines={3}>
                  {status}
                </Txt>
              </View>
              {!isEarned && progress ? (
                <View style={styles.progress}>
                  <ProgressBar value={progress.goal > 0 ? progress.current / progress.goal : 0} size="thin" />
                  <Txt variant="micro">{claimCopy.progress(progress.current, progress.goal)}</Txt>
                </View>
              ) : null}
              <RewardChips pay={pay} isMuted={!isEarned || isClaimed} />
              {pay.trucesConverted > 0 && !isClaimed ? (
                <Txt variant="micro" color="textMuted">
                  {rewardsCopy.rewards.truceConverted(
                    pay.trucesConverted,
                    pay.denarii - DECORATION_REWARDS[id].denarii,
                  )}
                </Txt>
              ) : null}
              {isEarned && !isClaimed ? (
                <ClaimButton
                  label={claimCopy.claim(pay.denarii)}
                  accessibilityLabel={claimCopy.claimLabel(item.name, reward)}
                  onClaim={() => onClaim(id)}
                  onProblem={(problem) => onProblem(rewardsCopy.rewards.problems[problem])}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Ends a line with a full stop unless it has one. */
function asSentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

const useStyles = createStyles((theme) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.md },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: theme.space.xs,
    padding: theme.space.md,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
  },
  // Earned: a card with a soft laurel light (brighter until claimed); locked: an outline to fill.
  earned: { ...cardSurface(theme), overflow: 'hidden' },
  locked: {
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.effects.cardBorder,
    borderStyle: 'dashed',
  },
  head: { gap: theme.space.xs },
  progress: { gap: theme.space.xxs },
}));
