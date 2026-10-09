import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { FlowLayout } from '@/components/onboarding/FlowLayout';
import { SelfieCapture } from '@/components/SelfieCapture';
import { Txt } from '@/components/Txt';
import { commonCopy, onboardingCopy } from '@/copy';
import { useCompleteOnboarding } from '@/hooks/useCompleteOnboarding';
import { useToday } from '@/hooks/useToday';
import { toRoman } from '@/lib/toRoman';
import { ONBOARDING_STEPS, useOnboardingStore } from '@/stores';
import { createStyles, SchemeOverride, useReduceMotion } from '@/theme';

const copy = onboardingCopy.selfie;

/** Step V: the first selfie, stamped DAY I. Finishing creates the arc and opens Today. */
export default function SelfieScreen() {
  const styles = useStyles();
  const today = useToday();
  const reduceMotion = useReduceMotion();
  const arcLength = useOnboardingStore((state) => state.arcLength);
  const setLastStep = useOnboardingStore((state) => state.setLastStep);
  const completeOnboarding = useCompleteOnboarding();
  const [selfiePath, setSelfiePath] = useState<string | null>(null);
  const [hasFinishError, setHasFinishError] = useState(false);

  useEffect(() => setLastStep('selfie'), [setLastStep]);

  const finish = (path: string | null) => {
    try {
      completeOnboarding(path);
      router.replace('/veni');
    } catch (error) {
      if (__DEV__) console.warn('[onboarding] Could not create the arc.', error);
      setHasFinishError(true);
    }
  };

  // "9 OCTOBER 2026" under the stamp.
  const stampCaption = commonCopy.fullDateLabel(today).toUpperCase();

  return (
    <FlowLayout
      step={5}
      totalSteps={ONBOARDING_STEPS.length}
      backHref="/onboarding/oath"
      title={copy.title}
      subtitle={copy.body(toRoman(arcLength))}
      footer={
        <>
          {hasFinishError ? (
            <Txt variant="caption" color="danger" align="center">
              {copy.finishFailed}
            </Txt>
          ) : null}
          {selfiePath ? (
            <Button label={copy.march} cue="confirm" onPress={() => finish(selfiePath)} />
          ) : (
            <Button label={copy.skip} variant="ghost" cue={null} onPress={() => finish(null)} />
          )}
        </>
      }
    >
      {/* The camera stays dark in light mode, like any camera. */}
      <SchemeOverride scheme="dark">
        <SelfieCapture
          day={today}
          stamp={{ text: copy.stamp, caption: stampCaption }}
          onCaptured={setSelfiePath}
        />
      </SchemeOverride>
      {selfiePath ? (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.delay(700).duration(500)}
          style={styles.quote}
        >
          <Txt variant="quote">{copy.quote}</Txt>
          <Txt variant="caption" style={styles.meaning}>
            {copy.quoteMeaning}
          </Txt>
        </Animated.View>
      ) : null}
    </FlowLayout>
  );
}

const useStyles = createStyles((theme) => ({
  quote: { marginTop: theme.space.xl },
  meaning: { marginTop: theme.space.xs },
}));
