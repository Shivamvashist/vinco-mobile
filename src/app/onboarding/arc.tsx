import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { FlowLayout } from '@/components/onboarding/FlowLayout';
import { OptionCard } from '@/components/OptionCard';
import { Txt } from '@/components/Txt';
import { commonCopy, onboardingCopy } from '@/copy';
import { ARC_LENGTHS, arcEndDay } from '@/features/arc';
import { useToday } from '@/hooks/useToday';
import { toRoman } from '@/lib/toRoman';
import { ONBOARDING_STEPS, useOnboardingStore } from '@/stores';
import { createStyles, useReduceMotion } from '@/theme';

const copy = onboardingCopy.arc;

/** Step I: how long the campaign runs, or the Ludus (no streak, no end). It starts today. */
export default function ArcLengthScreen() {
  const styles = useStyles();
  const today = useToday();
  const reduceMotion = useReduceMotion();
  const arcLength = useOnboardingStore((state) => state.arcLength);
  const arcKind = useOnboardingStore((state) => state.arcKind);
  const setArcLength = useOnboardingStore((state) => state.setArcLength);
  const chooseLudus = useOnboardingStore((state) => state.chooseLudus);
  const isLudus = arcKind === 'ludus';
  const setLastStep = useOnboardingStore((state) => state.setLastStep);

  useEffect(() => setLastStep('arc'), [setLastStep]);

  const summary = isLudus
    ? copy.ludus.summary(commonCopy.dayLabel(today, today))
    : copy.summary(
        commonCopy.dayLabel(today, today),
        commonCopy.dayLabel(arcEndDay(today, arcLength), today),
      );

  return (
    <FlowLayout
      step={1}
      totalSteps={ONBOARDING_STEPS.length}
      backHref="/onboarding"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={<Button label={onboardingCopy.continue} onPress={() => router.push('/onboarding/orders')} />}
    >
      <View style={styles.options} accessibilityRole="radiogroup">
        {ARC_LENGTHS.map((length) => {
          const option = copy.options[length];
          const isSelected = !isLudus && arcLength === length;
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
        <OptionCard
          title={copy.ludus.name}
          description={copy.ludus.description}
          selected={isLudus}
          onPress={chooseLudus}
          leading={
            <View style={[styles.numerals, styles.ludusIcon]}>
              <Icon name="workout" color={isLudus ? 'accent' : 'textMuted'} />
            </View>
          }
        />
      </View>
      <Card style={styles.summary}>
        <Txt variant="body">{summary}</Txt>
        <Animated.View
          key={isLudus ? 'ludus' : arcLength}
          entering={reduceMotion ? undefined : FadeInDown.duration(400)}
        >
          <Txt variant="caption" style={styles.quip}>
            {isLudus ? copy.ludus.quip : copy.options[arcLength].quip}
          </Txt>
        </Animated.View>
      </Card>
    </FlowLayout>
  );
}

const useStyles = createStyles((theme) => ({
  options: { gap: theme.space.md },
  numerals: { width: theme.layout.ringSize },
  ludusIcon: { alignItems: 'flex-start' },
  summary: { marginTop: theme.space.xl },
  quip: { marginTop: theme.space.xs },
}));
