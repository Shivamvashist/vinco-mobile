import { useState } from 'react';
import { View } from 'react-native';

import { arcCopy, onboardingCopy } from '@/copy';
import { ARC_LENGTHS, type ArcLength, DEFAULT_ARC_LENGTH } from '@/features/arc';
import { toRoman } from '@/lib/toRoman';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { OptionCard } from '../OptionCard';
import { Txt } from '../Txt';

export type BeginCampaignSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Starts it. Returns false when it could not be saved. */
  onBegin: (length: ArcLength) => boolean;
};

const copy = arcCopy.choice;

/** Picks 30, 60 or 90 days and crosses the Rubicon again, from today. */
export function BeginCampaignSheet({ visible, onClose, onBegin }: BeginCampaignSheetProps) {
  const styles = useStyles();
  const [length, setLength] = useState<ArcLength>(DEFAULT_ARC_LENGTH);
  const [hasFailed, setHasFailed] = useState(false);

  const close = () => {
    setHasFailed(false);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={copy.sheetTitle}>
      <Txt variant="body" color="textMuted">
        {copy.sheetBody}
      </Txt>
      <View style={styles.options} accessibilityRole="radiogroup">
        {ARC_LENGTHS.map((option) => (
          <OptionCard
            key={option}
            title={onboardingCopy.arc.options[option].name}
            description={onboardingCopy.arc.options[option].description}
            selected={option === length}
            onPress={() => setLength(option)}
            leading={
              <Txt variant="heading" color={option === length ? 'accent' : 'text'}>
                {option}
              </Txt>
            }
          />
        ))}
      </View>
      {hasFailed ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert">
          {copy.failed}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button
          label={copy.start(toRoman(length))}
          cue="cross"
          onPress={() => {
            if (onBegin(length)) close();
            else setHasFailed(true);
          }}
        />
        <Button label={copy.cancel} variant="ghost" cue={null} onPress={close} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  options: { gap: theme.space.sm, marginTop: theme.space.lg },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
