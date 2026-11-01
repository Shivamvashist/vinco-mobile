import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { guardCopy, reelsCopy } from '@/copy';
import { getReelAppLabels, GUARD_LEVELS, GUARD_RULES } from '@/features/guard';
import { useGuardStore } from '@/stores';
import { createStyles, useFeedback, useTheme } from '@/theme';

const copy = reelsCopy.settings;
const names = guardCopy.levels.names;
const APP_NAMES = getReelAppLabels();
/** The levels by their Latin names without quotes ("Vigil"); the plain label sits in the line below. */
const LEVEL_OPTIONS = GUARD_LEVELS.map((level) => ({
  value: level,
  label: names[level].name.replace(/"/g, ''),
}));

/**
 * What matters for reels, and nothing more: the guard level (what happens past the budget), the
 * daily budget, and which apps are counted. The full level descriptions stay on the guard screen.
 */
export function ReelSettings() {
  const styles = useStyles();
  const theme = useTheme();
  const play = useFeedback();
  const level = useGuardStore((state) => state.level);
  const setLevel = useGuardStore((state) => state.setLevel);
  const reelBudget = useGuardStore((state) => state.reelBudget);
  const setReelBudget = useGuardStore((state) => state.setReelBudget);

  return (
    <Card style={styles.card}>
      <View style={styles.block}>
        <Txt variant="label" accessibilityRole="header">
          {copy.level}
        </Txt>
        <SegmentedControl options={LEVEL_OPTIONS} value={level} onChange={setLevel} />
        <Txt variant="caption" accessibilityLiveRegion="polite">
          {`${names[level].name} (${names[level].plain}): ${copy.levelDoes[level]}`}
        </Txt>
      </View>
      <View style={styles.divider} />
      <Stepper
        caption={copy.budget}
        value={reelBudget}
        onChange={setReelBudget}
        {...GUARD_RULES.reelBudgetRange}
        formatValue={copy.budgetValue}
        accessibilityLabel={copy.budgetAdjust}
      />
      <Txt variant="caption">{copy.apps(APP_NAMES)}</Txt>
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          play('tap');
          router.push('/guard');
        }}
        style={styles.link}
      >
        <Txt variant="label" color="textMuted" style={styles.linkText}>
          {copy.more}
        </Txt>
        <Icon name="forward" color="textMuted" size={theme.layout.iconSizeSmall} />
      </Pressable>
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { gap: theme.space.md },
  block: { gap: theme.space.sm },
  divider: { height: theme.layout.hairline, backgroundColor: theme.colors.border },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.layout.minTouchTarget,
    gap: theme.space.xs,
  },
  linkText: { flex: 1 },
}));
