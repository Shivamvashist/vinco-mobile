import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { settingsCopy } from '@/copy';
import { cardSurface, createStyles, type Palette } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type PaletteCardProps = {
  palette: Palette;
  isSelected: boolean;
  onPress: () => void;
};

/**
 * One palette to pick: a small live preview drawn in the palette's own colours (an order row with
 * its circle, a line of text, a primary button, the purse), then its Latin name and plain label in
 * the app's current colours. The selected card has an accent ring and a check.
 */
export function PaletteCard({ palette, isSelected, onPress }: PaletteCardProps) {
  const styles = useStyles();
  const { colors } = palette;
  const meaning = settingsCopy.palettes[palette.id];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={settingsCopy.appearance.paletteLabel(palette.name, meaning, isSelected)}
      onPress={onPress}
      style={({ pressed }) => [styles.card, isSelected && styles.cardSelected, pressed && styles.pressed]}
    >
      <View style={[styles.preview, { backgroundColor: colors.background }]}>
        <View style={[styles.row, { backgroundColor: colors.surfaceSunk, borderColor: colors.border }]}>
          <View style={[styles.circle, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
            <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
              <Path
                d={TICK_PATH}
                stroke={colors.onAccent}
                strokeWidth={3.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View style={styles.lines}>
            <View style={[styles.lineLong, { backgroundColor: colors.text }]} />
            <View style={[styles.lineShort, { backgroundColor: colors.textMuted }]} />
          </View>
        </View>
        <View style={styles.footer}>
          <View style={[styles.button, { backgroundColor: colors.accent }]}>
            <View style={[styles.buttonText, { backgroundColor: colors.onAccent }]} />
          </View>
          <View style={[styles.coin, { borderColor: colors.currency }]} />
        </View>
        {isSelected ? (
          <View style={styles.check}>
            <Icon name="check" size={12} color="onAccent" strokeWidth={3} />
          </View>
        ) : null}
      </View>
      <View style={styles.text}>
        <Txt variant="label" numberOfLines={1}>
          {palette.name}
        </Txt>
        <Txt variant="caption" numberOfLines={1}>
          {meaning}
        </Txt>
      </View>
    </Pressable>
  );
}

/** The order circle's tick, drawn in the palette's own colour (Icon only knows the app's). */
const TICK_PATH = 'M5 12.5l4.5 4.5L19 7.5';

/** Fixed preview sizes: a drawing, not text, so they don't follow the type scale. */
const PREVIEW = { height: 92, circle: 16, lineHeight: 5, button: 18, coin: 12 } as const;

const useStyles = createStyles((theme) => ({
  card: {
    flex: 1,
    minWidth: 0,
    ...cardSurface(theme),
    // Full width in both states, so picking one never shifts the layout.
    borderWidth: theme.layout.borderWidthStrong,
    overflow: 'hidden',
  },
  cardSelected: { borderColor: theme.colors.accent },
  pressed: { opacity: 0.85 },
  preview: {
    height: PREVIEW.height,
    padding: theme.space.sm,
    gap: theme.space.sm,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    padding: theme.space.xs,
    borderRadius: theme.radius.sm,
    borderWidth: theme.layout.hairline,
  },
  circle: {
    width: PREVIEW.circle,
    height: PREVIEW.circle,
    borderRadius: PREVIEW.circle / 2,
    borderWidth: theme.layout.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lines: { flex: 1, gap: theme.space.xxs },
  lineLong: { width: '80%', height: PREVIEW.lineHeight, borderRadius: PREVIEW.lineHeight / 2 },
  lineShort: { width: '50%', height: PREVIEW.lineHeight, borderRadius: PREVIEW.lineHeight / 2, opacity: 0.8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  button: {
    width: '58%',
    height: PREVIEW.button,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { width: '50%', height: PREVIEW.lineHeight - 1, borderRadius: 2, opacity: 0.9 },
  coin: {
    width: PREVIEW.coin,
    height: PREVIEW.coin,
    borderRadius: PREVIEW.coin / 2,
    borderWidth: theme.layout.borderWidthStrong,
  },
  check: {
    position: 'absolute',
    top: theme.space.xs,
    right: theme.space.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  text: { paddingHorizontal: theme.space.sm, paddingVertical: theme.space.sm, gap: theme.space.xxs },
}));
