import { View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { FOCUS_GUARDS, FOCUS_RULES, type FocusGuard } from '@/features/focus';
import { createStyles, useFeedback, useTheme } from '@/theme';

export type GuardChoiceProps = {
  value: FocusGuard;
  onChange: (guard: FocusGuard) => void;
};

const GUARD_ICONS: Record<FocusGuard, IconName> = { custos: 'eye', imperium: 'block', silentium: 'moon' };

/** The focus guard: three cards (Latin name, plain label, what it does, its pay rate), pick one. */
export function GuardChoice({ value, onChange }: GuardChoiceProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();

  return (
    <View
      style={styles.list}
      accessibilityRole="radiogroup"
      accessibilityLabel={focusCopy.setup.guardSection}
    >
      {FOCUS_GUARDS.map((guard) => {
        const text = focusCopy.setup.guards[guard];
        const rate = focusCopy.setup.rate(Math.round(FOCUS_RULES.rates[guard] * 10));
        const isSelected = guard === value;
        return (
          <PressableScale
            key={guard}
            scaleTo="row"
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={`${text.name}, ${text.plain}. ${text.does} ${rate}.`}
            onPress={() => {
              if (isSelected) return;
              play('select');
              onChange(guard);
            }}
            style={[styles.card, isSelected && styles.cardSelected]}
          >
            <View style={[styles.iconTile, isSelected && styles.iconTileSelected]}>
              <Icon
                name={GUARD_ICONS[guard]}
                color={isSelected ? 'accent' : 'textMuted'}
                size={theme.layout.iconSizeSmall + theme.space.xs}
              />
            </View>
            <View style={styles.text}>
              <View style={styles.titleRow}>
                <Txt variant="headingSmall" numberOfLines={1}>
                  {text.name}
                </Txt>
                <Txt variant="caption" numberOfLines={1} style={styles.plain}>
                  {text.plain}
                </Txt>
              </View>
              <Txt variant="caption">{text.does}</Txt>
              <Txt variant="micro" color="currency">
                {rate}
              </Txt>
            </View>
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected ? <View style={styles.radioDot} /> : null}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  list: { gap: theme.space.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    minHeight: theme.layout.minTouchTarget,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  cardSelected: { borderColor: theme.colors.accentBorder, backgroundColor: theme.colors.accentTint },
  iconTile: {
    width: theme.layout.iconTileSize,
    height: theme.layout.iconTileSize,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSunk,
  },
  iconTileSelected: { backgroundColor: theme.colors.accentSoft },
  text: { flex: 1, gap: theme.space.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: theme.space.sm },
  plain: { flexShrink: 1 },
  radio: {
    width: theme.layout.statusCircleSize - theme.space.xs,
    height: theme.layout.statusCircleSize - theme.space.xs,
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidthStrong,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: theme.colors.accent },
  radioDot: {
    width: theme.space.md,
    height: theme.space.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
}));
