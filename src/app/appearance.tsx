import { router } from 'expo-router';
import { View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { PaletteCard } from '@/components/settings/PaletteCard';
import { commonCopy, settingsCopy } from '@/copy';
import {
  type ColorMode,
  createStyles,
  type Palette,
  palettesFor,
  type SchemeName,
  useFeedback,
  useTheme,
  useThemeControls,
} from '@/theme';

const copy = settingsCopy.appearance;

const MODES: readonly { value: ColorMode; label: string }[] = [
  { value: 'dark', label: settingsCopy.colorModes.dark },
  { value: 'light', label: settingsCopy.colorModes.light },
  { value: 'system', label: settingsCopy.colorModes.system },
];

const SECTIONS: readonly { scheme: SchemeName; title: string }[] = [
  { scheme: 'dark', title: copy.darkSection },
  { scheme: 'light', title: copy.lightSection },
];

/** Cards per row. Two keep each preview big enough to judge on the smallest phones. */
const COLUMNS = 2;

/**
 * Appearance, from Settings: the mode (dark, light, match phone), then a palette for each scheme.
 * Everything applies at once. Picking a palette of the other scheme while the mode is fixed
 * switches the mode too, so the choice is seen straight away.
 */
export default function AppearanceScreen() {
  const styles = useStyles();
  const theme = useTheme();
  const play = useFeedback();
  const { preferences, setColorMode, setPalette } = useThemeControls();

  const pick = (palette: Palette) => {
    play('select');
    setPalette(palette.scheme, palette.id);
    if (preferences.colorMode !== 'system' && palette.scheme !== theme.scheme) setColorMode(palette.scheme);
  };

  return (
    <Screen gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <IconButton
          icon="back"
          accessibilityLabel={commonCopy.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
        />
      </View>
      <ScreenHeader eyebrow={settingsCopy.eyebrow} title={copy.title} />

      <SectionHeader title={copy.mode} />
      <SegmentedControl
        options={MODES}
        value={preferences.colorMode}
        onChange={(mode) => {
          play('select');
          setColorMode(mode);
        }}
      />

      {SECTIONS.map(({ scheme, title }) => {
        const selectedId = scheme === 'dark' ? preferences.darkPaletteId : preferences.lightPaletteId;
        return (
          <View key={scheme}>
            <SectionHeader title={title} />
            <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel={title}>
              {chunk(palettesFor(scheme), COLUMNS).map((row) => (
                <View key={row.map((palette) => palette.id).join('-')} style={styles.row}>
                  {row.map((palette) => (
                    <PaletteCard
                      key={palette.id}
                      palette={palette}
                      isSelected={palette.id === selectedId}
                      onPress={() => pick(palette)}
                    />
                  ))}
                  {/* Keeps a lone last card at half width. */}
                  {row.length < COLUMNS ? <View style={styles.spacer} /> : null}
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

/** Splits a list into rows of `size`. */
function chunk<Item>(items: readonly Item[], size: number): Item[][] {
  const rows: Item[][] = [];
  for (let index = 0; index < items.length; index += size) rows.push(items.slice(index, index + size));
  return rows;
}

const useStyles = createStyles((theme) => ({
  nav: { marginLeft: -theme.space.sm },
  grid: { gap: theme.space.md },
  row: { flexDirection: 'row', gap: theme.space.md },
  spacer: { flex: 1 },
}));
