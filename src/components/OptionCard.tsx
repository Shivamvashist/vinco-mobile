import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { createStyles, type FeedbackCue, useFeedback, useReduceMotion } from '@/theme';

import { Txt } from './Txt';

export type OptionCardProps = {
  title: string;
  description?: string;
  /** Small gold pill next to the title, such as "Most chosen". */
  badge?: string;
  /** Left-hand block: the "LX / 60" numerals, or a tone icon. */
  leading?: ReactNode;
  selected: boolean;
  onPress: () => void;
  cue?: FeedbackCue | null;
};

const POP_MS = 140;

/**
 * One choice in a single-select list: arc length, tone, guard mode.
 * Wrap the list in a View with accessibilityRole="radiogroup".
 */
export function OptionCard({
  title,
  description,
  badge,
  leading,
  selected,
  onPress,
  cue = 'select',
}: OptionCardProps) {
  const styles = useStyles();
  const play = useFeedback();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const wasSelected = useRef(selected);

  // Pop only when this card becomes the selected one, never on first render.
  useEffect(() => {
    const becameSelected = selected && !wasSelected.current;
    wasSelected.current = selected;
    if (!becameSelected || reduceMotion) return;
    scale.value = withSequence(
      withTiming(0.96, { duration: 0 }),
      withTiming(1.02, { duration: POP_MS }),
      withTiming(1, { duration: POP_MS }),
    );
  }, [selected, reduceMotion, scale]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (selected) return;
    if (cue) play(cue);
    onPress();
  };

  const label = [title, badge, description].filter(Boolean).join('. ');

  return (
    <Animated.View style={popStyle}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={label}
        onPress={handlePress}
        style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
      >
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Txt variant="label" style={styles.title}>
              {title}
            </Txt>
            {badge ? (
              <View style={styles.badge}>
                <Txt variant="micro" color="onAccent" style={styles.badgeText} numberOfLines={1}>
                  {badge}
                </Txt>
              </View>
            ) : null}
          </View>
          {description ? (
            <Txt variant="caption" style={styles.description}>
              {description}
            </Txt>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    padding: theme.space.lg,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidthStrong,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSunk,
  },
  selected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentTint,
  },
  pressed: { opacity: 0.85 },
  leading: { flexShrink: 0 },
  text: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  title: { flexShrink: 1 },
  badge: {
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xxs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.accent,
  },
  badgeText: { fontFamily: theme.fonts.bodySemiBold },
  description: { marginTop: theme.space.xs },
}));
