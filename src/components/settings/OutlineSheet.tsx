import Slider from '@react-native-community/slider';
import { View } from 'react-native';

import { proofCopy, settingsCopy } from '@/copy';
import { createStyles, useTheme } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Txt } from '../Txt';

/** The slider moves in 5% steps, like the one on the camera. */
const STEP = 0.05;
const copy = settingsCopy.sheets.outline;

export type OutlineSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** 0 to `max`. */
  opacity: number;
  max: number;
  onChange: (opacity: number) => void;
};

/** How strongly yesterday's selfie shows over the camera. The same value as the camera's slider. */
export function OutlineSheet({ visible, onClose, opacity, max, onChange }: OutlineSheetProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <Txt variant="body" color="textMuted">
        {copy.body}
      </Txt>
      <View style={styles.labelRow}>
        <Txt variant="caption">{copy.label}</Txt>
        <Txt variant="caption" color="text">
          {proofCopy.camera.ghostValue(Math.round(opacity * 100))}
        </Txt>
      </View>
      <Slider
        accessibilityLabel={copy.label}
        minimumValue={0}
        maximumValue={max}
        step={STEP}
        value={Math.min(opacity, max)}
        onValueChange={onChange}
        minimumTrackTintColor={theme.colors.accent}
        maximumTrackTintColor={theme.colors.borderStrong}
        thumbTintColor={theme.colors.accent}
      />
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.lg },
}));
