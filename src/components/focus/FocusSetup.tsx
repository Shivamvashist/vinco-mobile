import { type ReactNode, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Txt } from '@/components/Txt';
import { focusCopy, pickTone } from '@/copy';
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
import { NoTruceSheet } from './NoTruceSheet';
import { SlideToConfirm } from './SlideToConfirm';

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
  onGetTruce: () => void;
  onClose: () => void;
};

/**
 * The focus setup, top to bottom: the time, the guard, the companions, the guard's permission
 * notice and the focus log; the reward line and "Slide to begin" stay pinned at the bottom. With
 * no Truce held, sliding first says what retreating early would cost.
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
  onGetTruce,
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
    denarii > 0 ? focusCopy.setup.reward(denarii, gloria) : focusCopy.setup.rewardGloriaOnly(gloria);
  const rewardNote =
    denarii > 0
      ? null
      : focusReward(minutes, guard) > 0
        ? focusCopy.setup.rewardDailyLimit
        : focusCopy.setup.rewardTooShort;

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
        <View style={styles.intro}>
          <Txt variant="title" align="center" accessibilityRole="header">
            {focusCopy.setup.title}
          </Txt>
          <Txt variant="body" color="textMuted" align="center">
            {pickTone(focusCopy.setup.subtitle, tone)}
          </Txt>
        </View>

        <Section title={focusCopy.setup.timeSection}>
          <DurationPicker value={minutes} onChange={setMinutes} />
        </Section>

        <Section title={focusCopy.setup.guardSection}>
          <GuardPicker value={guard} onChange={setGuard} />
          <GuardPermissionNotice guard={guard} permissions={permissions} />
        </Section>

        <Section title={focusCopy.comites.section} caption={focusCopy.comites.caption}>
          <ComitesRow comites={comites} onOpenPicker={() => setSheet('comites')} />
        </Section>

        <FocusLog totals={log.totals} sessions={log.sessions} today={today} tone={tone} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.space.lg }]}>
        <View style={styles.rewardRow}>
          <Icon
            name="coin"
            color={denarii > 0 ? 'currency' : 'textFaint'}
            size={theme.layout.iconSizeSmall}
          />
          <Txt variant="labelSmall" color={denarii > 0 ? 'currency' : 'textMuted'} style={styles.rewardText}>
            {rewardLine}
          </Txt>
        </View>
        {rewardNote ? (
          <Txt variant="caption" align="center">
            {rewardNote}
          </Txt>
        ) : null}
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
      <NoTruceSheet
        visible={sheet === 'noTruce'}
        onClose={() => setSheet(null)}
        onGetTruce={() => {
          setSheet(null);
          onGetTruce();
        }}
        onBeginAnyway={begin}
      />
    </View>
  );
}

function Section({ title, caption, children }: { title: string; caption?: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Txt variant="overline" accessibilityRole="header">
          {title}
        </Txt>
        {caption ? <Txt variant="caption">{caption}</Txt> : null}
      </View>
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
  intro: { gap: theme.space.sm },
  section: { gap: theme.space.md },
  sectionHead: { gap: theme.space.xxs },
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
