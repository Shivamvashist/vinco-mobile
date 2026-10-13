import { View } from 'react-native';

import { commonCopy, onboardingCopy, settingsCopy } from '@/copy';
import { type Tone, TONES } from '@/features/tone';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Icon, type IconName } from '../Icon';
import { OptionCard } from '../OptionCard';

const TONE_ICONS: Record<Tone, IconName> = { philosopher: 'book', centurion: 'helmet', roast: 'flame' };

export type ToneSheetProps = {
  visible: boolean;
  onClose: () => void;
  tone: Tone;
  onChange: (tone: Tone) => void;
};

/** Picks how Vinco talks: Philosopher, Centurion or Roast me. Applies at once. */
export function ToneSheet({ visible, onClose, tone, onChange }: ToneSheetProps) {
  const styles = useStyles();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={settingsCopy.sheets.tone}>
      <View style={styles.options} accessibilityRole="radiogroup">
        {TONES.map((option) => (
          <OptionCard
            key={option}
            title={commonCopy.toneNames[option]}
            description={onboardingCopy.tone.descriptions[option]}
            selected={option === tone}
            onPress={() => onChange(option)}
            leading={<Icon name={TONE_ICONS[option]} color={option === tone ? 'accent' : 'textMuted'} />}
          />
        ))}
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  options: { gap: theme.space.sm, marginTop: theme.space.md },
}));
