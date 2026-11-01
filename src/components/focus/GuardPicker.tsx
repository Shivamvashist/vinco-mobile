import { useWindowDimensions, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { FOCUS_GUARDS, type FocusGuard } from '@/features/focus';
import { cardSurface, createStyles, useFeedback, useTheme } from '@/theme';

import { Glow } from '../Glow';
import { GuardAvatar } from './avatars/GuardAvatar';

export type GuardPickerProps = {
  value: FocusGuard;
  onChange: (guard: FocusGuard) => void;
};

const copy = focusCopy.setup;
const AVATAR_SHARE = 0.13;

/**
 * The focus guard: three cards in a row (emblem, level pips, plain label and Latin name), the
 * chosen one lit; its one-line rule shows below the row. The level is spoken, the pips show it.
 */
export function GuardPicker({ value, onChange }: GuardPickerProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const { width } = useWindowDimensions();
  // A share of the width, between the theme's large spacing steps, so three always fit in a row.
  const avatarSize = Math.round(
    Math.min(theme.space.giant, Math.max(theme.space.xxxl + theme.space.sm, width * AVATAR_SHARE)),
  );
  const chosen = copy.guards[value];

  return (
    <View style={styles.wrap}>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={copy.guardSection}>
        {FOCUS_GUARDS.map((guard, index) => {
          const text = copy.guards[guard];
          const isSelected = guard === value;
          return (
            <PressableScale
              key={guard}
              scaleTo="card"
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${text.name}, ${text.plain}, ${text.level}.`}
              onPress={() => {
                if (isSelected) return;
                play('select');
                onChange(guard);
              }}
              containerStyle={styles.cell}
              style={[styles.card, isSelected && styles.cardSelected]}
            >
              {isSelected ? <Glow color="accent" intensity={0.7} origin="bottom" /> : null}
              <GuardAvatar guard={guard} isSelected={isSelected} size={avatarSize} />
              <View style={styles.pips}>
                {FOCUS_GUARDS.map((pip, pipIndex) => (
                  <View
                    key={pip}
                    style={[styles.pip, pipIndex <= index && (isSelected ? styles.pipLit : styles.pipOn)]}
                  />
                ))}
              </View>
              <Txt variant="label" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {text.plain}
              </Txt>
              <Txt variant="caption" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {text.name}
              </Txt>
            </PressableScale>
          );
        })}
      </View>

      <Txt variant="caption" color="text" align="center" accessibilityLiveRegion="polite">
        {chosen.rule}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.md },
  row: { flexDirection: 'row', gap: theme.space.sm },
  cell: { flex: 1 },
  card: {
    alignItems: 'center',
    gap: theme.space.xxs,
    minHeight: theme.layout.minTouchTarget,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.xs,
    ...cardSurface(theme),
    // Full width in both states, so picking one never shifts the layout.
    borderWidth: theme.layout.borderWidth,
    overflow: 'hidden',
  },
  cardSelected: { borderColor: theme.colors.accentBorder, backgroundColor: theme.colors.accentTint },
  pips: { flexDirection: 'row', gap: theme.space.xs, marginTop: theme.space.xs },
  pip: {
    width: theme.space.xs + 1,
    height: theme.space.xs + 1,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  pipOn: { backgroundColor: theme.colors.textMuted },
  pipLit: { backgroundColor: theme.colors.accent },
}));
