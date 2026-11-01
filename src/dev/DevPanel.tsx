/**
 * DEV ONLY: the dev tools card in Settings, shown when dev mode is on (dev builds only).
 * Moves the calendar ahead or back (removing the days after the new today), fills today's orders, adds denarii, opens the theme lab and resets everything.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { commonCopy, devCopy } from '@/copy';
import { db, grantDevDenarii } from '@/db';
import { DEV_GRANT_DENARII } from '@/features/campaign';
import type { OrderTargets } from '@/features/orders';
import { useResetJourney } from '@/hooks/useResetJourney';
import { useToday } from '@/hooks/useToday';
import { MAX_DAY_OFFSET, useDevStore } from '@/stores';
import { createStyles, useFeedback } from '@/theme';

import { fillDayOrders } from './devActions';
import { LastCrash } from './LastCrash';
import { planRewind, type RewindPlan, RewindError } from './rewind';
import { useDevRewind } from './useDevRewind';

export type DevPanelProps = {
  /** The active arc's orders, or null before onboarding: the day tools need an arc. */
  targets: OrderTargets | null;
};

export function DevPanel({ targets }: DevPanelProps) {
  const styles = useStyles();
  const play = useFeedback();
  const today = useToday();
  const resetJourney = useResetJourney();
  const dayOffset = useDevStore((state) => state.dayOffset);
  const advanceDay = useDevStore((state) => state.advanceDay);
  const rewind = useDevRewind();
  const [isResetOpen, setIsResetOpen] = useState(false);
  // Kept while the sheet slides out, so its words don't vanish mid-exit.
  const [rewindPlan, setRewindPlan] = useState<RewindPlan | null>(null);
  const [isRewindOpen, setIsRewindOpen] = useState(false);
  const openRewind = (plan: RewindPlan | null) => {
    if (!plan) return;
    setRewindPlan(plan);
    setIsRewindOpen(true);
  };
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const isAtMaxOffset = dayOffset >= MAX_DAY_OFFSET;

  const run = (action: () => void) => {
    try {
      action();
      setMessage(null);
    } catch (error) {
      console.warn('[dev] Action failed.', error);
      play('denied');
      setMessage({ text: devCopy.failed, isError: true });
    }
  };

  const confirmRewind = (plan: RewindPlan) => {
    setIsRewindOpen(false);
    try {
      rewind(plan);
      setMessage(null);
    } catch (error) {
      console.warn('[dev] Rewind failed.', error);
      play('denied');
      const isBeforeArc = error instanceof RewindError && error.reason === 'before_first_arc';
      setMessage({ text: isBeforeArc ? devCopy.rewindBeforeArc : devCopy.failed, isError: true });
    }
  };
  const previousPlan = planRewind(today, dayOffset, 'previous');
  const realPlan = planRewind(today, dayOffset, 'real');

  const fill = (level: 'hold' | 'conquer') => {
    if (targets) run(() => fillDayOrders(db, today, targets, level));
  };

  return (
    <View style={styles.card}>
      <Txt variant="label">{devCopy.today(commonCopy.fullDateLabel(today), dayOffset)}</Txt>
      {targets ? null : (
        <Txt variant="caption" style={styles.note}>
          {devCopy.noArc}
        </Txt>
      )}
      {message ? (
        <Txt
          variant="caption"
          color={message.isError ? 'danger' : 'currency'}
          accessibilityRole={message.isError ? 'alert' : undefined}
          style={styles.note}
        >
          {message.text}
        </Txt>
      ) : null}

      <LastCrash />
      <View style={styles.actions}>
        <Button
          label={devCopy.holdToday}
          variant="secondary"
          size="compact"
          disabled={!targets}
          onPress={() => fill('hold')}
        />
        <Button
          label={devCopy.conquerToday}
          variant="secondary"
          size="compact"
          disabled={!targets}
          onPress={() => fill('conquer')}
        />
        <Button
          label={devCopy.nextDay}
          variant="secondary"
          size="compact"
          disabled={isAtMaxOffset}
          accessibilityHint={devCopy.nextDayHint}
          onPress={() => run(advanceDay)}
        />
        <Txt variant="caption" style={styles.note}>
          {isAtMaxOffset ? devCopy.atMaxOffset : devCopy.nextDayHint}
        </Txt>
        <Button
          label={devCopy.previousDay}
          variant="secondary"
          size="compact"
          disabled={!previousPlan}
          accessibilityHint={devCopy.rewindHint}
          onPress={() => openRewind(previousPlan)}
        />
        {dayOffset > 1 ? (
          <Button
            label={devCopy.backToToday}
            variant="secondary"
            size="compact"
            accessibilityHint={devCopy.rewindHint}
            onPress={() => openRewind(realPlan)}
          />
        ) : null}
        <Button
          label={devCopy.addDenarii(DEV_GRANT_DENARII)}
          variant="secondary"
          size="compact"
          cue="confirm"
          onPress={() => {
            try {
              setMessage({ text: devCopy.addedDenarii(grantDevDenarii(db, today)), isError: false });
            } catch (error) {
              console.warn('[dev] Could not add denarii.', error);
              play('denied');
              setMessage({ text: devCopy.failed, isError: true });
            }
          }}
        />
        <Button
          label={devCopy.themeLab}
          variant="secondary"
          size="compact"
          onPress={() => router.push('/dev/theme-lab')}
        />
        <Button
          label={devCopy.resetAll}
          variant="danger"
          size="compact"
          onPress={() => setIsResetOpen(true)}
        />
      </View>

      <BottomSheet
        visible={isRewindOpen}
        onClose={() => setIsRewindOpen(false)}
        title={rewindPlan ? devCopy.rewindTitle(commonCopy.fullDateLabel(rewindPlan.newToday)) : ''}
      >
        <Txt variant="body" color="textMuted">
          {rewindPlan ? devCopy.rewindBody(commonCopy.fullDateLabel(rewindPlan.newToday)) : ''}
        </Txt>
        <View style={styles.sheetActions}>
          <Button
            label={devCopy.rewindConfirm}
            variant="danger"
            cue="denied"
            onPress={() => {
              if (rewindPlan) confirmRewind(rewindPlan);
            }}
          />
          <Button label={devCopy.cancel} variant="ghost" cue={null} onPress={() => setIsRewindOpen(false)} />
        </View>
      </BottomSheet>

      <BottomSheet visible={isResetOpen} onClose={() => setIsResetOpen(false)} title={devCopy.resetTitle}>
        <Txt variant="body" color="textMuted">
          {devCopy.resetBody}
        </Txt>
        <View style={styles.sheetActions}>
          <Button
            label={devCopy.resetAll}
            variant="danger"
            cue="denied"
            onPress={() =>
              run(() => {
                setIsResetOpen(false);
                resetJourney('everything');
              })
            }
          />
          <Button label={devCopy.cancel} variant="ghost" cue={null} onPress={() => setIsResetOpen(false)} />
        </View>
      </BottomSheet>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.surfaceSunk,
  },
  note: { marginTop: theme.space.xs },
  actions: { marginTop: theme.space.md, gap: theme.space.sm },
  sheetActions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
