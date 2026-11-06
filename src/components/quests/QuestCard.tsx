import { View } from 'react-native';

import { rewardsCopy } from '@/copy';
import { type ClaimPay, type LabourId, type LabourStatus } from '@/features/labours';
import type { ClaimOutcome } from '@/hooks/useLabours';
import { createStyles, useTheme } from '@/theme';

import { Card } from '../Card';
import { ClaimButton } from '../hud/ClaimButton';
import { Icon, type IconName } from '../Icon';
import { ProgressBar } from '../ProgressBar';
import { Txt } from '../Txt';
import { RewardChips } from './RewardChips';

export type QuestCardProps = {
  status: LabourStatus;
  /** What claiming would pay now. */
  pay: ClaimPay;
  onClaim: () => ClaimOutcome;
  onProblem: (message: string) => void;
};

const copy = rewardsCopy.quests;

/** Goals this small get a bar of chunks, one per step; bigger ones (minutes) a smooth bar. */
const MAX_SEGMENTS = 7;

const EMBLEMS: Record<LabourId, IconName> = {
  selfie: 'camera',
  weight: 'scale',
  focus: 'eye',
  todos: 'list',
  conquer: 'laurel',
  holdWeek: 'helmet',
  conquerWeek: 'medal',
  focusWeek: 'eye',
  wakeWeek: 'sunrise',
};

/**
 * One quest as a small game card: a round emblem, the title, the loot as pills and a chunky bar
 * with its count ("2/3"). Ready: the card warms with a gold glow, the emblem turns gold and a
 * Claim button sends the loot flying to the counters. Claimed: the emblem shows a check and the
 * card dims, with no word on screen. Needs orders: the bar gives way to a short note.
 */
export function QuestCard({ status, pay, onClaim, onProblem }: QuestCardProps) {
  const styles = useStyles();
  const theme = useTheme();
  const { labour, state } = status;
  const title = copy.items[labour.id].title;
  const isReady = state === 'claimable';
  const isClaimed = state === 'claimed';
  const isLocked = state === 'unavailable';
  const goal = Math.max(1, labour.goal);
  const current = isClaimed ? goal : Math.max(0, Math.min(status.current, goal));
  const isChunked = goal > 1 && goal <= MAX_SEGMENTS;
  const barLabel = `${title}: ${copy.progressLabel(labour.id, current, goal)}`;

  return (
    <Card
      style={[styles.card, isReady && styles.ready, isClaimed && styles.claimed]}
      glow={isReady ? { color: 'accent', origin: 'bottomLeft', intensity: 0.55 } : undefined}
    >
      <View style={styles.top}>
        <View
          style={[styles.emblem, isReady && styles.emblemReady, isClaimed && styles.emblemClaimed]}
          accessible={isClaimed}
          accessibilityLabel={isClaimed ? copy.claimedLabel(title) : undefined}
        >
          <Icon
            name={isClaimed ? 'check' : isLocked ? 'lock' : EMBLEMS[labour.id]}
            size={theme.layout.iconSize}
            color={isReady ? 'onAccent' : isClaimed ? 'accent' : isLocked ? 'textFaint' : 'text'}
            strokeWidth={isClaimed || isReady ? 2.2 : 1.8}
          />
        </View>
        <View style={styles.body}>
          <Txt variant="label" color={isClaimed || isLocked ? 'textMuted' : 'text'} numberOfLines={2}>
            {title}
          </Txt>
          <RewardChips pay={pay} isMuted={isClaimed || isLocked} look="pills" />
        </View>
        {isReady ? (
          <ClaimButton
            label={copy.claim}
            accessibilityLabel={copy.claimLabel(title, rewardsCopy.rewards.describe(pay))}
            onClaim={onClaim}
            onProblem={(problem) => onProblem(rewardsCopy.rewards.problems[problem])}
          />
        ) : null}
      </View>

      {isLocked ? (
        <Txt variant="micro" style={styles.note}>
          {copy.needsOrders}
        </Txt>
      ) : (
        <View style={styles.progress}>
          <View style={styles.bar}>
            {isChunked ? (
              <ProgressBar
                size="bold"
                segments={{ total: goal, filled: current }}
                color={isClaimed ? 'accentBorder' : 'accent'}
                accessibilityLabel={barLabel}
              />
            ) : (
              <ProgressBar
                size="bold"
                value={current / goal}
                color={isClaimed ? 'accentBorder' : 'accent'}
                accessibilityLabel={barLabel}
              />
            )}
          </View>
          <Txt
            variant="labelSmall"
            color={isReady ? 'accent' : 'textMuted'}
            numberOfLines={1}
            style={styles.count}
            importantForAccessibility="no"
            accessibilityElementsHidden
          >
            {copy.progress(labour.id, current, goal)}
          </Txt>
        </View>
      )}

      {pay.trucesConverted > 0 && !isClaimed ? (
        <Txt variant="micro" color="textMuted" style={styles.note}>
          {rewardsCopy.rewards.truceConverted(pay.trucesConverted, pay.denarii - labour.reward.denarii)}
        </Txt>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { gap: theme.space.md },
  ready: { borderColor: theme.colors.accentBorder, borderWidth: theme.layout.borderWidth },
  // Static: a claimed quest steps back, it never fades out.
  claimed: { opacity: 0.62 },
  top: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  emblem: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSunk,
    borderWidth: theme.layout.borderWidthStrong,
    borderColor: theme.colors.border,
  },
  emblemReady: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accentBorder },
  emblemClaimed: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accentBorder },
  body: { flex: 1, minWidth: 0, gap: theme.space.sm },
  progress: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  bar: { flex: 1 },
  count: { minWidth: theme.layout.minTouchTarget, textAlign: 'right', fontVariant: ['tabular-nums'] },
  note: { marginTop: -theme.space.xs },
}));
