import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { FlowLayout } from '@/components/onboarding/FlowLayout';
import { OathRecorder } from '@/components/onboarding/OathRecorder';
import { Txt } from '@/components/Txt';
import { onboardingCopy } from '@/copy';
import { ONBOARDING_STEPS, useOnboardingStore } from '@/stores';
import { createStyles } from '@/theme';

const copy = onboardingCopy.oath;

/** Step IV: a 20-second oath in the user's own voice, played back on the day most people quit. */
export default function OathScreen() {
  const styles = useStyles();
  const arcLength = useOnboardingStore((state) => state.arcLength);
  const oathPath = useOnboardingStore((state) => state.oathPath);
  const setOathPath = useOnboardingStore((state) => state.setOathPath);
  const setLastStep = useOnboardingStore((state) => state.setLastStep);

  useEffect(() => setLastStep('oath'), [setLastStep]);

  const goNext = () => router.push('/onboarding/selfie');

  return (
    <FlowLayout
      step={4}
      totalSteps={ONBOARDING_STEPS.length}
      backHref="/onboarding/tone"
      title={copy.title}
      subtitle={copy.body}
      footer={
        oathPath ? (
          <Button label={onboardingCopy.continue} onPress={goNext} />
        ) : (
          <Button label={copy.skip} variant="ghost" cue={null} onPress={goNext} />
        )
      }
    >
      <View style={styles.prompts}>
        {copy.prompts(arcLength).map((prompt) => (
          <View key={prompt} style={styles.prompt}>
            <Txt variant="caption" color="text">
              {prompt}
            </Txt>
          </View>
        ))}
      </View>
      <OathRecorder savedPath={oathPath} onSaved={setOathPath} onCleared={() => setOathPath(null)} />
    </FlowLayout>
  );
}

const useStyles = createStyles((theme) => ({
  prompts: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  prompt: {
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
}));
