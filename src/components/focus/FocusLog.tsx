import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { commonCopy, focusCopy, pickTone } from '@/copy';
import type { FocusSessionRow } from '@/db';
import { type FocusTotals, isFocusGuard } from '@/features/focus';
import type { Tone } from '@/features/tone';
import type { DayKey } from '@/lib/dates';
import { formatClockTime } from '@/lib/dates';
import { cardSurface, createStyles } from '@/theme';

export type FocusLogProps = {
  totals: FocusTotals;
  /** Finished sessions, newest first. */
  sessions: readonly FocusSessionRow[];
  today: DayKey;
  tone: Tone;
};

const copy = focusCopy.log;

/** Minutes held today, this week and all time, then every finished session (day, time, guard, length, result). */
export function FocusLog({ totals, sessions, today, tone }: FocusLogProps) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <Txt variant="overline" accessibilityRole="header">
        {copy.section}
      </Txt>
      <View style={styles.totals}>
        <Total label={copy.today} minutes={totals.today} />
        <Total label={copy.week} minutes={totals.week} />
        <Total label={copy.allTime} minutes={totals.allTime} />
      </View>
      {sessions.length === 0 ? (
        <Txt variant="body" color="textMuted">
          {pickTone(copy.empty, tone)}
        </Txt>
      ) : (
        <View style={styles.list}>
          {sessions.map((session, index) => {
            const day = commonCopy.dayLabel(session.day, today);
            const started = new Date(session.startedAt);
            const time = Number.isFinite(started.getTime()) ? formatClockTime(started) : '';
            const guard = isFocusGuard(session.guard) ? focusCopy.setup.guards[session.guard].plain : '';
            const minutes = focusCopy.shortDuration(session.minutes);
            const isHeld = session.status === 'completed';
            const result = isHeld ? copy.held : copy.retreated;
            return (
              <View
                key={session.id}
                style={[styles.row, index > 0 && styles.divider]}
                accessible
                accessibilityLabel={copy.row(day, time, guard, minutes, result)}
              >
                <View style={styles.when}>
                  <Txt variant="label" numberOfLines={1}>
                    {day}
                  </Txt>
                  <Txt variant="caption" numberOfLines={1}>
                    {`${time} · ${guard}`}
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
          })}
        </View>
      )}
    </View>
  );
}

function Total({ label, minutes }: { label: string; minutes: number }) {
  const styles = useStyles();
  return (
    <View
      style={styles.total}
      accessible
      accessibilityLabel={`${label}, ${focusCopy.spokenDuration(minutes)}`}
    >
      <Txt
        variant="heading"
        style={styles.tabular}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {focusCopy.shortDuration(minutes)}
      </Txt>
      <Txt variant="caption" numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.md },
  totals: { flexDirection: 'row', gap: theme.space.sm },
  total: {
    flex: 1,
    gap: theme.space.xxs,
    padding: theme.layout.cardPadding,
    ...cardSurface(theme),
  },
  tabular: { fontVariant: ['tabular-nums'] },
  list: {
    paddingHorizontal: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.surfaceSunk,
  },
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
}));
