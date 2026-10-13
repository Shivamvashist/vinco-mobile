import { View } from 'react-native';

import { settingsCopy } from '@/copy';
import { type ColorMode, createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { OptionCard } from '../OptionCard';

const COLOR_MODES: ColorMode[] = ['dark', 'light', 'system'];

export type AppearanceSheetProps = {
  visible: boolean;
  onClose: () => void;
  colorMode: ColorMode;
  onChange: (mode: ColorMode) => void;
};

/** Dark (Basalt), light (Marble) or match the phone. Applies at once. */
export function AppearanceSheet({ visible, onClose, colorMode, onChange }: AppearanceSheetProps) {
  const styles = useStyles();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={settingsCopy.sheets.colorMode}>
      <View style={styles.options} accessibilityRole="radiogroup">
        {COLOR_MODES.map((mode) => (
          <OptionCard
            key={mode}
            title={settingsCopy.colorModes[mode]}
            selected={colorMode === mode}
            onPress={() => onChange(mode)}
          />
        ))}
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  options: { gap: theme.space.sm, marginTop: theme.space.md },
}));
