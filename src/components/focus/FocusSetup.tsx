import { type ReactNode, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import type { FocusSessionRow } from '@/db';
import {
  DEFAULT_FOCUS_GUARD,
  expectedFocusReward,
  FOCUS_RULES,
  type FocusComes,
  type FocusGuard,
  focusReward,
  type FocusTotals,
  shouldWarnNoTruce,
} from '@/features/focus';
import { focusGloria } from '@/features/gloria';
import type { Tone } from '@/features/tone';
import type { GuardPermissions } from '@/hooks/useGuardPermissions';
import type { DayKey } from '@/lib/dates';
import { createStyles, useTheme } from '@/theme';

import { ComitesPicker } from './ComitesPicker';
import { ComitesRow } from './ComitesRow';
import { DurationPicker } from './DurationPicker';
import { FocusLog } from './FocusLog';
import { GuardPermissionNotice } from './GuardPermissionNotice';
import { GuardPicker } from './GuardPicker';
import { SlideToConfirm } from './SlideToConfirm';
import { TruceSheet } from './TruceSheet';

export type FocusSetupProps = {
  tone: Tone;
  today: DayKey;
  /** Focus sessions already paid today: from three, a new one pays no denarii. */
  rewardedToday: number;
  truceReserve: number;
  comites: readonly FocusComes[];
  onToggleComes: (app: FocusComes) => void;
  permissions: GuardPermissions;
  log: { totals: FocusTotals; sessions: readonly FocusSessionRow[] };
  onBegin: (minutes: number, guard: FocusGuard) => 'started' | 'busy' | 'failed';
  /** Opens the full focus log. */
  onSeeLog?: () => void;
  onClose: () => void;
};

/**
 * The focus setup, top to bottom: the time, the guard (and its permission notice), the companions
 * and the focus log; the reward line and "Slide to begin" stay pinned at the bottom. With no Truce
 * held, sliding first says the focus can't end early without one, and offers to buy one.
 */
export function FocusSetup({
  tone,
  today,
  rewardedToday,
  truceReserve,
  comites,
  onToggleComes,
  permissions,
  log,
  onBegin,
  onSeeLog,
  onClose,
}: FocusSetupProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [minutes, setMinutes] = useState<number>(FOCUS_RULES.defaultMinutes);
  const [guard, setGuard] = useState<FocusGuard>(DEFAULT_FOCUS_GUARD);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'comites' | 'noTruce' | null>(null);

  const denarii = expectedFocusReward(minutes, guard, rewardedToday);
  const gloria = focusGloria(minutes);
  const rewardLine =
    denarii > 0
      ? focusCopy.setup.reward(denarii, gloria)
      : focusReward(minutes, guard) > 0
        ? focusCopy.setup.rewardDailyLimit(gloria)
        : focusCopy.setup.rewardTooShort(gloria);

  const begin = () => {
    setSheet(null);
    const result = onBegin(minutes, guard);
    if (result === 'busy') setError(focusCopy.setup.busy);
    else if (result === 'failed') setError(focusCopy.setup.failed);
  };

  const handleSlide = () => {
    setError(null);
    if (shouldWarnNoTruce(truceReserve)) setSheet('noTruce');
    else begin();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton
          icon="close"
          accessibilityLabel={focusCopy.setup.close}
          onPress={onClose}
          color="textMuted"
        />
        <Txt variant="eyebrow" numberOfLines={1} style={styles.eyebrow}>
          {focusCopy.setup.eyebrow}
        </Txt>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Txt variant="title" align="center" accessibilityRole="header">
          {focusCopy.setup.title}
        </Txt>

        <DurationPicker value={minutes} onChange={setMinutes} />

        <Section title={focusCopy.setup.guardSection}>
          <GuardPicker value={guard} onChange={setGuard} />
          <GuardPermissionNotice guard={guard} permissions={permissions} />
        </Section>

        <Section title={focusCopy.comites.section}>
          <ComitesRow comites={comites} onOpenPicker={() => setSheet('comites')} />
        </Section>

        <FocusLog totals={log.totals} sessions={log.sessions} today={today} tone={tone} onSeeAll={onSeeLog} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.space.lg }]}>
        <View
          style={styles.rewardRow}
          accessible
          accessibilityLabel={focusCopy.setup.rewardLabel(rewardLine)}
        >
          <Icon
            name="coin"
            color={denarii > 0 ? 'currency' : 'textFaint'}
            size={theme.layout.iconSizeSmall}
          />
          <Txt variant="labelSmall" color={denarii > 0 ? 'currency' : 'textMuted'} style={styles.rewardText}>
            {rewardLine}
          </Txt>
        </View>
        {error ? (
          <Txt variant="caption" color="danger" align="center" accessibilityLiveRegion="polite">
            {error}
          </Txt>
        ) : null}
        <SlideToConfirm
          label={focusCopy.setup.begin}
          accessibilityHint={focusCopy.setup.beginHint}
          onConfirm={handleSlide}
          icon="play"
        />
      </View>

      <ComitesPicker
        visible={sheet === 'comites'}
        comites={comites}
        onToggle={onToggleComes}
        onClose={() => setSheet(null)}
      />
      <TruceSheet
        visible={sheet === 'noTruce'}
        mode="begin"
        onClose={() => setSheet(null)}
        // Bought: the user slid to begin, so the focus begins.
        onBought={begin}
        onBeginAnyway={begin}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Txt variant="overline" accessibilityRole="header">
        {title}
      </Txt>
      {children}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.sm,
    minHeight: theme.layout.minTouchTarget,
  },
  eyebrow: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: theme.layout.minTouchTarget },
  content: {
    paddingHorizontal: theme.layout.flowGutter,
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.xxl,
    gap: theme.space.xxl,
  },
  section: { gap: theme.space.md },
  footer: {
    paddingHorizontal: theme.layout.flowGutter,
    paddingTop: theme.space.md,
    gap: theme.space.sm,
    borderTopWidth: theme.layout.hairline,
    borderTopColor: theme.colors.border,
  },
  rewardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.space.sm },
  rewardText: { flexShrink: 1 },
}));
