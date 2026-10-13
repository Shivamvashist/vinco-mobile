import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FlowLayout } from '@/components/onboarding/FlowLayout';
import { OptionCard } from '@/components/OptionCard';
import { Txt } from '@/components/Txt';
import { commonCopy, onboardingCopy } from '@/copy';
import { ARC_LENGTHS, arcEndDay } from '@/features/arc';
import { useToday } from '@/hooks/useToday';
import { toRoman } from '@/lib/toRoman';
import { getStepPosition, useOnboardingStore } from '@/stores';
import { createStyles, useReduceMotion } from '@/theme';

const copy = onboardingCopy.arc;

/** Campaign path, step II: how long the campaign runs. It starts today, with Vinco's four orders. */
export default function ArcLengthScreen() {
  const styles = useStyles();
  const today = useToday();
  const reduceMotion = useReduceMotion();
  const arcLength = useOnboardingStore((state) => state.arcLength);
  const setArcLength = useOnboardingStore((state) => state.setArcLength);
  const setLastStep = useOnboardingStore((state) => state.setLastStep);
  const position = getStepPosition('arc', 'campaign');

  // Reaching this screen means a campaign: the length shown is the one chosen.
  useEffect(() => {
    setLastStep('arc');
    setArcLength(useOnboardingStore.getState().arcLength);
  }, [setLastStep, setArcLength]);

  const summary = copy.summary(
    commonCopy.dayLabel(today, today),
    commonCopy.dayLabel(arcEndDay(today, arcLength), today),
  );

  return (
    <FlowLayout
      step={position.step}
      totalSteps={position.total}
      backHref="/onboarding/plan"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={<Button label={onboardingCopy.continue} onPress={() => router.push('/onboarding/orders')} />}
    >
      <View style={styles.options} accessibilityRole="radiogroup">
        {ARC_LENGTHS.map((length) => {
          const option = copy.options[length];
          const isSelected = arcLength === length;
          return (
            <OptionCard
              key={length}
              title={option.name}
              description={option.description}
              badge={length === 60 ? copy.mostChosen : undefined}
              selected={isSelected}
              onPress={() => setArcLength(length)}
              leading={
                <View style={styles.numerals}>
                  <Txt variant="eyebrow">{toRoman(length)}</Txt>
                  <Txt variant="display" color={isSelected ? 'accent' : 'text'}>
                    {length}
                  </Txt>
                </View>
              }
            />
          );
        })}
      </View>
      <Card style={styles.summary}>
        <Txt variant="body">{summary}</Txt>
        <Animated.View key={arcLength} entering={reduceMotion ? undefined : FadeInDown.duration(400)}>
          <Txt variant="caption" style={styles.quip}>
            {copy.options[arcLength].quip}
          </Txt>
        </Animated.View>
      </Card>
    </FlowLayout>
  );
}

const useStyles = createStyles((theme) => ({
  options: { gap: theme.space.md },
  numerals: { width: theme.layout.ringSize },
  summary: { marginTop: theme.space.xl },
  quip: { marginTop: theme.space.xs },
}));
