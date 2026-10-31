import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Txt } from '@/components/Txt';
import { focusCopy, pickTone } from '@/copy';
import {
  DEFAULT_FOCUS_GUARD,
  expectedFocusReward,
  FOCUS_RULES,
  type FocusGuard,
  focusReward,
} from '@/features/focus';
import { guardBridge } from '@/features/guard';
import type { Tone } from '@/features/tone';
import { createStyles, useTheme } from '@/theme';

import { DurationRuler } from './DurationRuler';
import { GuardChoice } from './GuardChoice';

export type FocusSetupProps = {
  tone: Tone;
  /** Focus sessions already paid today: from three, a new one pays nothing. */
  rewardedToday: number;
  onBegin: (minutes: number, guard: FocusGuard) => 'started' | 'busy' | 'failed';
  onClose: () => void;
};

/** Pick a time and a guard, see the pay, begin. The first stage of the focus view. */
export function FocusSetup({ tone, rewardedToday, onBegin, onClose }: FocusSetupProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [minutes, setMinutes] = useState<number>(FOCUS_RULES.defaultMinutes);
  const [guard, setGuard] = useState<FocusGuard>(DEFAULT_FOCUS_GUARD);
  const [error, setError] = useState<string | null>(null);

  const reward = expectedFocusReward(minutes, guard, rewardedToday);
  const rewardLine =
    reward > 0
      ? focusCopy.setup.reward(reward)
      : focusReward(minutes, guard) > 0
        ? focusCopy.setup.rewardDailyLimit
        : focusCopy.setup.rewardTooShort;

  const handleBegin = () => {
    const result = onBegin(minutes, guard);
    if (result === 'busy') setError(focusCopy.setup.busy);
    else if (result === 'failed') setError(focusCopy.setup.failed);
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

        <DurationRuler value={minutes} onChange={setMinutes} />

        <View style={styles.section}>
          <Txt variant="overline" accessibilityRole="header">
            {focusCopy.setup.guardSection}
          </Txt>
          <GuardChoice value={guard} onChange={setGuard} />
          {guardBridge.isSupported ? null : (
            <View style={styles.notice}>
              <Icon name="lock" color="textMuted" size={theme.layout.iconSizeSmall} />
              <Txt variant="caption" style={styles.noticeText}>
                {focusCopy.setup.notYet}
              </Txt>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.space.lg }]}>
        <View style={styles.rewardRow}>
          <Icon name="coin" color={reward > 0 ? 'currency' : 'textFaint'} size={theme.layout.iconSizeSmall} />
          <Txt variant="labelSmall" color={reward > 0 ? 'currency' : 'textMuted'} style={styles.rewardText}>
            {rewardLine}
          </Txt>
        </View>
        {error ? (
          <Txt variant="caption" color="danger" align="center" accessibilityLiveRegion="polite">
            {error}
          </Txt>
        ) : null}
        <Button label={focusCopy.setup.begin} onPress={handleBegin} cue="confirm" />
      </View>
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
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.sm,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunk,
  },
  noticeText: { flex: 1 },
  footer: {
    paddingHorizontal: theme.layout.flowGutter,
    paddingTop: theme.space.md,
    gap: theme.space.md,
    borderTopWidth: theme.layout.hairline,
    borderTopColor: theme.colors.border,
  },
  rewardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.space.sm },
  rewardText: { flexShrink: 1 },
}));
