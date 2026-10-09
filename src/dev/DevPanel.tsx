/**
 * DEV ONLY: the dev tools card in Vici, shown when dev mode is on (dev builds only).
 * Moves the calendar ahead, fills today's orders, opens the theme lab and resets everything.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { commonCopy, devCopy } from '@/copy';
import { db } from '@/db';
import type { OrderTargets } from '@/features/orders';
import { useResetJourney } from '@/hooks/useResetJourney';
import { useToday } from '@/hooks/useToday';
import { MAX_DAY_OFFSET, useDevStore } from '@/stores';
import { createStyles, useFeedback } from '@/theme';

import { fillDayOrders } from './devActions';

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
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isAtMaxOffset = dayOffset >= MAX_DAY_OFFSET;

  const run = (action: () => void) => {
    try {
      action();
      setMessage(null);
    } catch (error) {
      console.warn('[dev] Action failed.', error);
      play('denied');
      setMessage(devCopy.failed);
    }
  };

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
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.note}>
          {message}
        </Txt>
      ) : null}

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
