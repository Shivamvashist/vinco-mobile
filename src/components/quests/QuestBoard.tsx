import { useState } from 'react';
import { View } from 'react-native';

import { pickTone, rewardsCopy } from '@/copy';
import {
  daysUntilReset,
  type LabourId,
  type LabourStatus,
  type LabourType,
  rankLabours,
  resolveClaimPay,
} from '@/features/labours';
import type { Tone } from '@/features/tone';
import type { ClaimOutcome } from '@/hooks/useLabours';
import type { DayKey } from '@/lib/dates';
import { createStyles } from '@/theme';

import { ToneLine } from '../ToneLine';
import { Txt } from '../Txt';
import { QuestCard } from './QuestCard';

export type QuestBoardProps = {
  board: readonly LabourStatus[];
  today: DayKey;
  /** Truces held now: a Truce reward at the cap pays denarii instead. */
  truceReserve: number;
  tone: Tone;
  onClaim: (id: LabourId) => ClaimOutcome;
};

const copy = rewardsCopy.quests;
const GROUPS: readonly LabourType[] = ['daily', 'weekly'];

/**
 * Every quest, daily then weekly: ready ones on top, then the closest to done, claimed ones last.
 * Each group says how many are claimed and when it resets. When nothing is left to do, the tone's
 * line says so. A refused claim shows its reason above the board.
 */
export function QuestBoard({ board, today, truceReserve, tone, onClaim }: QuestBoardProps) {
  const styles = useStyles();
  const [problem, setProblem] = useState<string | null>(null);
  const ranked = rankLabours(board);
  const ready = board.filter((status) => status.state === 'claimable').length;
  const isCleared = board.every((status) => status.state === 'claimed' || status.state === 'unavailable');

  return (
    <View>
      <View style={styles.head}>
        <Txt variant="heading" accessibilityRole="header" style={styles.title}>
          {copy.title}
        </Txt>
        {ready > 0 ? (
          <View style={styles.ready}>
            <Txt variant="labelSmall" color="onAccent" numberOfLines={1}>
              {copy.readyCount(ready)}
            </Txt>
          </View>
        ) : null}
      </View>
      {problem ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.problem}>
          {problem}
        </Txt>
      ) : null}
      {isCleared ? (
        <View style={styles.cleared}>
          <ToneLine line={pickTone(copy.allDone, tone)} tone={tone} />
        </View>
      ) : null}

      {GROUPS.map((type) => {
        const quests = ranked.filter((status) => status.labour.type === type);
        if (quests.length === 0) return null;
        const claimed = quests.filter((status) => status.state === 'claimed').length;
        return (
          <View key={type} style={styles.group}>
            <View style={styles.groupHead}>
              <View style={styles.groupText}>
                <Txt variant="overline" accessibilityRole="header">
                  {copy.groups[type]}
                </Txt>
                <Txt variant="micro">{copy.resets(type, daysUntilReset(type, today))}</Txt>
              </View>
              <View
                style={styles.tally}
                accessible
                accessibilityLabel={copy.groupCountLabel(claimed, quests.length)}
              >
                <Txt variant="labelSmall" color={claimed === quests.length ? 'accent' : 'textMuted'}>
                  {copy.groupCount(claimed, quests.length)}
                </Txt>
              </View>
            </View>
            <View style={styles.list}>
              {quests.map((status) => (
                <QuestCard
                  key={status.labour.id}
                  status={status}
                  pay={resolveClaimPay(status.labour.reward, truceReserve)}
                  onClaim={() => {
                    setProblem(null);
                    return onClaim(status.labour.id);
                  }}
                  onProblem={setProblem}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  head: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: theme.space.sm },
  title: { flexShrink: 1 },
  ready: {
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xxs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
  problem: { marginTop: theme.space.sm },
  cleared: { marginTop: theme.space.md },
  group: { marginTop: theme.space.xl },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.space.md,
    marginBottom: theme.space.md,
  },
  groupText: { flex: 1, gap: theme.space.xxs },
  tally: {
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xxs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
  list: { gap: theme.space.sm },
}));
