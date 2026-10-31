import { View } from 'react-native';

import { rewardsCopy } from '@/copy';
import { type ClaimPay, type LabourId, type LabourStatus } from '@/features/labours';
import type { ClaimOutcome } from '@/hooks/useLabours';
import { createStyles, iconTile } from '@/theme';

import { ClaimButton } from '../hud/ClaimButton';
import { Icon, type IconName } from '../Icon';
import { ProgressBar } from '../ProgressBar';
import { Txt } from '../Txt';

import { RewardChips } from './RewardChips';

export type LabourRowProps = {
  status: LabourStatus;
  /** What claiming would pay now. */
  pay: ClaimPay;
  /** "Resets at midnight", shown on the full board. */
  note?: string;
  onClaim: () => ClaimOutcome;
  onProblem: (message: string) => void;
};

const copy = rewardsCopy.labours;

const ICONS: Record<LabourId, IconName> = {
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
 * One labour: its mark, what to do, a progress bar and what it pays; a gold "Claim" once done,
 * "Claimed" after. A Truce reward at a full reserve says it pays denarii instead.
 */
export function LabourRow({ status, pay, note, onClaim, onProblem }: LabourRowProps) {
  const styles = useStyles();
  const { labour, state } = status;
  const item = copy.items[labour.id];
  const isDone = state === 'claimed';
  const progress =
    state === 'unavailable' ? copy.needsOrders : copy.progress(labour.id, status.current, labour.goal);

  return (
    <View style={styles.row}>
      <View style={[styles.mark, state === 'claimable' && styles.markReady]}>
        <Icon
          name={isDone ? 'check' : ICONS[labour.id]}
          size={styles.markIcon.width}
          color={state === 'claimable' || isDone ? 'accent' : 'textMuted'}
        />
      </View>
      <View style={styles.body}>
        <Txt variant="label" color={isDone ? 'textMuted' : 'text'} numberOfLines={2}>
          {item.title}
        </Txt>
        {state === 'working' || state === 'claimable' ? (
          <ProgressBar value={status.ratio} size="thin" accessibilityLabel={`${item.title}: ${progress}`} />
        ) : null}
        <Txt variant="micro">{[isDone ? copy.claimed : progress, note].filter(Boolean).join(' · ')}</Txt>
        <RewardChips pay={pay} isMuted={isDone || state === 'unavailable'} />
        {pay.trucesConverted > 0 && !isDone ? (
          <Txt variant="micro" color="textMuted">
            {rewardsCopy.rewards.truceConverted(pay.trucesConverted, pay.denarii - labour.reward.denarii)}
          </Txt>
        ) : null}
      </View>
      {state === 'claimable' ? (
        <ClaimButton
          label={copy.claim}
          accessibilityLabel={copy.claimLabel(item.title, rewardsCopy.rewards.describe(pay))}
          onClaim={onClaim}
          onProblem={(problem) => onProblem(rewardsCopy.rewards.problems[problem])}
        />
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md, paddingVertical: theme.space.sm },
  mark: iconTile(theme, 'surfaceSunk'),
  markReady: { backgroundColor: theme.colors.accentSoft },
  markIcon: { width: theme.layout.iconSizeSmall },
  body: { flex: 1, minWidth: 0, gap: theme.space.xs },
}));
