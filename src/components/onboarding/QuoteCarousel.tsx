import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { createStyles, useReduceMotion } from '@/theme';

import { Txt } from '../Txt';

export type Quote = { text: string; author: string };

export type QuoteCarouselProps = {
  quotes: readonly Quote[];
  /** Read to screen readers: what tapping does. */
  accessibilityHint: string;
};

const ROTATE_EVERY_MS = 5000;

/**
 * Stoic quotes that rotate on their own and on tap, with a dot for each.
 * With reduced motion they only change on tap.
 */
export function QuoteCarousel({ quotes, accessibilityHint }: QuoteCarouselProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const [index, setIndex] = useState(0);
  const count = quotes.length;
  const quote = quotes[index % Math.max(count, 1)];

  useEffect(() => {
    if (reduceMotion || count < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), ROTATE_EVERY_MS);
    return () => clearInterval(timer);
  }, [reduceMotion, count]);

  if (!quote) return null;

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${quote.text} ${quote.author}`}
        accessibilityHint={accessibilityHint}
        onPress={() => setIndex((current) => (current + 1) % count)}
        style={styles.quote}
      >
        <Animated.View key={index} entering={reduceMotion ? undefined : FadeInDown.duration(600)}>
          <Txt variant="title">{`"${quote.text}"`}</Txt>
          <Txt variant="body" color="textMuted" style={styles.author}>
            {quote.author}
          </Txt>
        </Animated.View>
      </Pressable>
      <View style={styles.dots} importantForAccessibility="no-hide-descendants">
        {quotes.map((item, dotIndex) => (
          <View key={item.text} style={[styles.dot, dotIndex === index % count && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  quote: { minHeight: 200, justifyContent: 'flex-start' },
  author: { marginTop: theme.space.lg },
  dots: { flexDirection: 'row', gap: theme.space.xs + theme.space.xxs, marginTop: theme.space.md },
  dot: {
    width: theme.space.sm,
    height: theme.space.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  dotActive: { width: theme.space.xl + theme.space.xxs, backgroundColor: theme.colors.accent },
}));
