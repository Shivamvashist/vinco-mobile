import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { focusCopy, pickTone } from '@/copy';
import type { FocusSessionRow as FocusSessionRecord } from '@/db';
import type { FocusTotals } from '@/features/focus';
import type { Tone } from '@/features/tone';
import type { DayKey } from '@/lib/dates';
import { cardSurface, createStyles, useFeedback, useTheme } from '@/theme';

import { FocusSessionRow } from './FocusSessionRow';

export type FocusLogProps = {
  totals: FocusTotals;
  /** The newest finished sessions (three), newest first. */
  sessions: readonly FocusSessionRecord[];
  today: DayKey;
  tone: Tone;
  /** Opens the full log (/focus-log): weeks, months and years as charts. */
  onSeeAll?: () => void;
};

const copy = focusCopy.log;

/**
 * Minutes held today, this week and all time, then the newest finished sessions (day, time, guard,
 * length, result) and "See all", which opens the full log.
 */
export function FocusLog({ totals, sessions, today, tone, onSeeAll }: FocusLogProps) {
  const styles = useStyles();
  const play = useFeedback();
  const theme = useTheme();
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
          {sessions.map((session, index) => (
            <FocusSessionRow key={session.id} session={session} today={today} hasDivider={index > 0} />
          ))}
          {onSeeAll ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.seeAllLabel}
              onPress={() => {
                play('tap');
                onSeeAll();
              }}
              style={({ pressed }) => [styles.row, styles.divider, pressed && styles.pressed]}
            >
              <Txt variant="label" color="accent" style={styles.seeAll}>
                {copy.seeAll}
              </Txt>
              <Icon name="forward" color="accent" size={theme.layout.iconSizeSmall} />
            </Pressable>
          ) : null}
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
  seeAll: { flex: 1 },
  pressed: { opacity: 0.6 },
}));
