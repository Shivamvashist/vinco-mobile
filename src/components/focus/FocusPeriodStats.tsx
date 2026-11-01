import { View } from 'react-native';

import { Card } from '@/components/Card';
import { Txt } from '@/components/Txt';
import { commonCopy, focusCopy } from '@/copy';
import { FOCUS_GUARDS, type FocusGuard, type FocusPeriodSummary } from '@/features/focus';
import type { DayKey } from '@/lib/dates';
import { cardSurface, type ColorRole, createStyles, useTheme } from '@/theme';

export type FocusPeriodStatsProps = {
  summary: FocusPeriodSummary;
  today: DayKey;
};

const copy = focusCopy.history;
/** Watch, Block, Silence: the guards from lightest to strictest. */
const GUARD_COLORS: Record<FocusGuard, ColorRole> = { custos: 'info', imperium: 'accent', silentium: 'seal' };

/** The period in numbers: minutes and focuses held, retreats, the best day and run, then the guards. */
export function FocusPeriodStats({ summary, today }: FocusPeriodStatsProps) {
  const styles = useStyles();
  const theme = useTheme();
  const best = summary.bestDay;
  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        <Stat label={copy.minutesHeld} value={focusCopy.shortDuration(summary.minutesHeld)} color="accent" />
        <Stat label={copy.sessionsHeld} value={String(summary.sessionsHeld)} />
        <Stat label={copy.sessionsRetreated} value={String(summary.sessionsRetreated)} />
        <Stat
          label={copy.bestDay}
          value={best ? focusCopy.shortDuration(best.minutes) : copy.none}
          caption={best ? commonCopy.dayLabel(best.day, today) : undefined}
        />
        <Stat
          label={copy.longestRun}
          value={summary.longestRun > 0 ? copy.runDays(summary.longestRun) : copy.none}
        />
      </View>
      {summary.minutesHeld > 0 ? (
        <Card>
          <Txt variant="overline" accessibilityRole="header">
            {copy.guardSplit}
          </Txt>
          <View style={styles.split} importantForAccessibility="no-hide-descendants">
            {FOCUS_GUARDS.map((guard) =>
              summary.byGuard[guard] > 0 ? (
                <View
                  key={guard}
                  style={{ flex: summary.byGuard[guard], backgroundColor: theme.colors[GUARD_COLORS[guard]] }}
                />
              ) : null,
            )}
          </View>
          {FOCUS_GUARDS.map((guard) => {
            const name = focusCopy.setup.guards[guard].plain;
            const minutes = summary.byGuard[guard];
            return (
              <View
                key={guard}
                style={styles.guardRow}
                accessible
                accessibilityLabel={copy.guardShare(name, minutes)}
              >
                <View style={[styles.dot, { backgroundColor: theme.colors[GUARD_COLORS[guard]] }]} />
                <Txt variant="caption" color="text" style={styles.guardName} numberOfLines={1}>
                  {`${focusCopy.setup.guards[guard].name} · ${name}`}
                </Txt>
                <Txt variant="caption" style={styles.tabular}>
                  {focusCopy.shortDuration(minutes)}
                </Txt>
              </View>
            );
          })}
        </Card>
      ) : null}
    </View>
  );
}

function Stat({
  label,
  value,
  caption,
  color = 'text',
}: {
  label: string;
  value: string;
  caption?: string;
  color?: ColorRole;
}) {
  const styles = useStyles();
  return (
    <View
      style={styles.stat}
      accessible
      accessibilityLabel={[label, value, caption].filter(Boolean).join(', ')}
    >
      <Txt variant="heading" color={color} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {value}
      </Txt>
      <Txt variant="caption" numberOfLines={2}>
        {caption ? `${label} · ${caption}` : label}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  stat: {
    flexGrow: 1,
    flexBasis: '40%',
    gap: theme.space.xxs,
    padding: theme.layout.cardPadding,
    ...cardSurface(theme),
  },
  split: {
    flexDirection: 'row',
    height: theme.layout.barHeightThick,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    gap: theme.space.xxs,
    marginTop: theme.space.sm,
    marginBottom: theme.space.sm,
  },
  guardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingVertical: theme.space.xxs,
  },
  dot: { width: theme.space.sm, height: theme.space.sm, borderRadius: theme.radius.pill },
  guardName: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
}));
