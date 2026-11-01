import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { commonCopy, focusCopy } from '@/copy';
import type { FocusSessionRow as FocusSessionRecord } from '@/db';
import { isFocusGuard } from '@/features/focus';
import type { DayKey } from '@/lib/dates';
import { formatClockTime } from '@/lib/dates';
import { createStyles } from '@/theme';

export type FocusSessionRowProps = {
  session: FocusSessionRecord;
  today: DayKey;
  /** A hairline above, between rows. */
  hasDivider?: boolean;
};

const copy = focusCopy.log;

/** One finished focus: the day and start time with its guard, then its length and Held or Retreated. */
export function FocusSessionRow({ session, today, hasDivider = false }: FocusSessionRowProps) {
  const styles = useStyles();
  const day = commonCopy.dayLabel(session.day, today);
  const started = new Date(session.startedAt);
  const time = Number.isFinite(started.getTime()) ? formatClockTime(started) : '';
  const guard = isFocusGuard(session.guard) ? focusCopy.setup.guards[session.guard].plain : '';
  const minutes = focusCopy.shortDuration(session.minutes);
  const isHeld = session.status === 'completed';
  const result = isHeld ? copy.held : copy.retreated;
  return (
    <View
      style={[styles.row, hasDivider && styles.divider]}
      accessible
      accessibilityLabel={copy.row(day, time, guard, minutes, result)}
    >
      <View style={styles.when}>
        <Txt variant="label" numberOfLines={1}>
          {day}
        </Txt>
        <Txt variant="caption" numberOfLines={1}>
          {[time, guard].filter(Boolean).join(' · ')}
        </Txt>
      </View>
      <View style={styles.what}>
        <Txt variant="label" style={styles.tabular}>
          {minutes}
        </Txt>
        <Txt variant="caption" color={isHeld ? 'accent' : 'textMuted'}>
          {result}
        </Txt>
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    minHeight: theme.layout.minTouchTarget,
    paddingVertical: theme.space.sm,
  },
  divider: { borderTopWidth: theme.layout.hairline, borderTopColor: theme.colors.border },
  when: { flex: 1, gap: theme.space.xxs },
  what: { alignItems: 'flex-end', gap: theme.space.xxs },
  tabular: { fontVariant: ['tabular-nums'] },
}));
