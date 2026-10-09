import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { QuoteCarousel } from '@/components/onboarding/QuoteCarousel';
import { RiverLines } from '@/components/onboarding/RiverLines';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { onboardingCopy } from '@/copy';
import { useOnboardingStore } from '@/stores';
import { createStyles } from '@/theme';

const copy = onboardingCopy.rubicon;

/** Cross the Rubicon: the first screen. One quote, one river, one button. */
export default function RubiconScreen() {
  const styles = useStyles();
  const setLastStep = useOnboardingStore((state) => state.setLastStep);

  const handleCross = () => {
    setLastStep('arc');
    router.push('/onboarding/arc');
  };

  return (
    <Screen scroll={false} gutter="flow" edges={['top', 'bottom']}>
      <Txt variant="heading" align="center" style={styles.wordmark} accessibilityRole="header">
        {copy.wordmark}
      </Txt>
      <View style={styles.quote}>
        <QuoteCarousel quotes={copy.quotes} accessibilityHint={copy.quoteHint} />
      </View>
      <View style={styles.spacer} />
      <RiverLines />
      <Txt variant="caption" align="center" style={styles.caption}>
        {copy.caption}
      </Txt>
      <Button
        label={copy.cross}
        sublabel={copy.crossSublabel}
        size="large"
        cue="cross"
        onPress={handleCross}
      />
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  wordmark: { letterSpacing: 5, marginTop: theme.space.xxxl },
  quote: { marginTop: theme.space.huge * 2 },
  spacer: { flex: 1 },
  caption: { marginTop: theme.space.xxl, marginBottom: theme.space.lg },
}));
