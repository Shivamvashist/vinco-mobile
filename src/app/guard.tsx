import { router } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/Card';
import { PreviewNotice } from '@/components/guard/PreviewNotice';
import { ReelCountCard } from '@/components/guard/ReelCountCard';
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
import { useGuardPermissions } from '@/hooks/useGuardPermissions';
import { useReelCount } from '@/hooks/useReelCount';
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
 * The four guard levels (Pax, Vigil, Guard, Imperium), today's reel count and the reel budget.
 * With the native Vigil module the count is live (docs/GUARDIANS.md "The reel counter"); in Expo
 * Go the choice is saved and the preview notice says the counter arrives with the build.
 */
export default function GuardScreen() {
  const styles = useStyles();
  const level = useGuardStore((state) => state.level);
  const setLevel = useGuardStore((state) => state.setLevel);
  const reelBudget = useGuardStore((state) => state.reelBudget);
  const setReelBudget = useGuardStore((state) => state.setReelBudget);
  const reels = useReelCount();
  const permissions = useGuardPermissions();

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/settings');
  };

  return (
    <Screen gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <IconButton icon="back" accessibilityLabel={commonCopy.back} onPress={back} />
      </View>
      <ScreenHeader eyebrow={copy.eyebrow} title={copy.title} />
      {reels.canCount ? (
        <>
          <SectionHeader title={guardCopy.reels.section} />
          <ReelCountCard
            count={reels.today}
            allowance={reels.allowance}
            isServiceOn={permissions.granted?.accessibility ?? null}
            onPress={() => router.push('/reels')}
          />
        </>
      ) : (
        <View style={styles.block}>
          <PreviewNotice />
        </View>
      )}

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
