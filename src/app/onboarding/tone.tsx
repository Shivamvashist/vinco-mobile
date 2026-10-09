import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { ChoiceChip } from '@/components/ChoiceChip';
import { Icon, type IconName } from '@/components/Icon';
import { FlowLayout } from '@/components/onboarding/FlowLayout';
import { TypingPreview } from '@/components/onboarding/TypingPreview';
import { OptionCard } from '@/components/OptionCard';
import { commonCopy, onboardingCopy, pickTone } from '@/copy';
import { type Tone, TONES } from '@/features/tone';
import { ONBOARDING_STEPS, useOnboardingStore, usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

const copy = onboardingCopy.tone;

const TONE_ICONS: Record<Tone, IconName> = {
  philosopher: 'book',
  centurion: 'helmet',
  roast: 'flame',
};

/** Step III: how Vinco talks. The preview types out a real message in the chosen tone. */
export default function ToneScreen() {
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);
  const setTone = usePreferencesStore((state) => state.setTone);
  const setLastStep = useOnboardingStore((state) => state.setLastStep);
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = copy.scenes[sceneIndex] ?? copy.scenes[0];

  useEffect(() => setLastStep('tone'), [setLastStep]);

  return (
    <FlowLayout
      step={3}
      totalSteps={ONBOARDING_STEPS.length}
      backHref="/onboarding/orders"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={<Button label={onboardingCopy.continue} onPress={() => router.push('/onboarding/oath')} />}
    >
      <View style={styles.scenes} accessibilityRole="radiogroup">
        {copy.scenes.map((option, index) => (
          <ChoiceChip
            key={option.label}
            label={option.label}
            selected={index === sceneIndex}
            onPress={() => setSceneIndex(index)}
          />
        ))}
      </View>
      <TypingPreview sender={copy.sender} time={scene.time} message={pickTone(scene.lines, tone)} />
      <View style={styles.tones} accessibilityRole="radiogroup">
        {TONES.map((option) => {
          const isSelected = option === tone;
          return (
            <OptionCard
              key={option}
              title={commonCopy.toneNames[option]}
              description={copy.descriptions[option]}
              selected={isSelected}
              onPress={() => setTone(option)}
              leading={
                <View style={[styles.toneIcon, isSelected && styles.toneIconSelected]}>
                  <Icon name={TONE_ICONS[option]} color="accent" />
                </View>
              }
            />
          );
        })}
      </View>
    </FlowLayout>
  );
}

const useStyles = createStyles((theme) => ({
  scenes: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginBottom: theme.space.md },
  tones: { gap: theme.space.md, marginTop: theme.space.xl },
  toneIcon: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneIconSelected: { borderColor: theme.colors.accent },
}));
