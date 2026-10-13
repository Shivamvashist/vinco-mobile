import { router } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/Card';
import { PreviewNotice } from '@/components/guard/PreviewNotice';
import { Icon, type IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { OptionCard } from '@/components/OptionCard';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { commonCopy, guardCopy } from '@/copy';
import { GUARD_LEVEL_SHIPS, GUARD_LEVELS, GUARD_RULES, type GuardLevel } from '@/features/guard';
import { useGuardStore } from '@/stores';
import { createStyles } from '@/theme';

const copy = guardCopy.levels;
const LEVEL_ICONS: Record<GuardLevel, IconName> = {
  pax: 'dove',
  vigil: 'eye',
  guard: 'helmet',
  imperium: 'block',
};

/**
 * The four guard levels (Pax, Vigil, Guard, Imperium) and the reel budget. In preview: the
 * choice is saved now and works with the native Vigil module. See docs/GUARDIANS.md.
 */
export default function GuardScreen() {
  const styles = useStyles();
  const level = useGuardStore((state) => state.level);
  const setLevel = useGuardStore((state) => state.setLevel);
  const reelBudget = useGuardStore((state) => state.reelBudget);
  const setReelBudget = useGuardStore((state) => state.setReelBudget);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/settings');
  };

  return (
    <Screen gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <IconButton icon="back" accessibilityLabel={commonCopy.back} onPress={back} />
      </View>
      <ScreenHeader eyebrow={copy.eyebrow} title={copy.title} caption={copy.intro} />
      <View style={styles.block}>
        <PreviewNotice />
      </View>

      <View style={[styles.block, styles.options]} accessibilityRole="radiogroup">
        {GUARD_LEVELS.map((option) => {
          const names = copy.names[option];
          const isSelected = option === level;
          return (
            <OptionCard
              key={option}
              title={`${names.name} · ${names.plain}`}
              description={names.does}
              badge={copy.ships(GUARD_LEVEL_SHIPS[option])}
              selected={isSelected}
              onPress={() => setLevel(option)}
              leading={<Icon name={LEVEL_ICONS[option]} color={isSelected ? 'accent' : 'textMuted'} />}
            />
          );
        })}
      </View>

      <SectionHeader title={copy.budgetSection} />
      <Card>
        <Stepper
          caption={copy.budgetLabel}
          value={reelBudget}
          onChange={setReelBudget}
          {...GUARD_RULES.reelBudgetRange}
          formatValue={copy.budgetValue}
          accessibilityLabel={copy.budgetAdjust}
        />
        <Txt variant="caption" style={styles.note}>
          {copy.budgetNote}
        </Txt>
      </Card>

      <SectionHeader title={copy.privacyTitle} />
      <Txt variant="body" color="textMuted">
        {copy.privacy}
      </Txt>
      <Txt variant="caption" style={styles.note}>
        {copy.neverBlocked}
      </Txt>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: theme.space.sm },
  block: { marginTop: theme.space.lg },
  options: { gap: theme.space.sm },
  note: { marginTop: theme.space.sm },
}));
