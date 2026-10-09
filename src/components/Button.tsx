import { useRef } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { createStyles, type FeedbackCue, useFeedback, useTheme } from '@/theme';

import { Txt } from './Txt';

/** A second press inside this window is ignored, so a double tap can't act twice. */
const PRESS_GUARD_MS = 500;

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  /** regular 56, compact 48, large 64 (two lines: label in the display face plus a sublabel). */
  size?: 'regular' | 'compact' | 'large';
  /** Second line under the label. Large size only. */
  sublabel?: string;
  disabled?: boolean;
  /** Shows a spinner and ignores presses. */
  loading?: boolean;
  /** Sound and haptic on press. null for silent. */
  cue?: FeedbackCue | null;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  sublabel,
  disabled = false,
  loading = false,
  cue = 'tap',
  accessibilityHint,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const lastPressAt = useRef(0);

  const isInactive = disabled || loading;
  const isPrimary = variant === 'primary';
  const showSublabel = size === 'large' && sublabel != null;
  const labelColor = disabled
    ? 'textMuted'
    : isPrimary
      ? 'onAccent'
      : variant === 'ghost'
        ? 'textMuted'
        : 'text';

  const handlePress = () => {
    const now = Date.now();
    if (isInactive || now - lastPressAt.current < PRESS_GUARD_MS) return;
    lastPressAt.current = now;
    if (cue) play(cue);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={showSublabel ? `${label}, ${sublabel}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, busy: loading }}
      disabled={isInactive}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        disabled && variant !== 'ghost' && styles.disabled,
        pressed && styles[`${variant}Pressed`],
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors[isPrimary ? 'onAccent' : 'text']} />
      ) : (
        <View style={styles.labels}>
          <Txt
            variant={size === 'large' ? 'quote' : 'button'}
            color={labelColor}
            numberOfLines={1}
            style={size === 'large' ? styles.largeLabel : undefined}
          >
            {label}
          </Txt>
          {showSublabel ? (
            <Txt variant="labelSmall" color={labelColor} numberOfLines={1}>
              {sublabel}
            </Txt>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  base: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.xxl,
  },
  regular: { minHeight: theme.layout.buttonHeight },
  compact: { minHeight: theme.layout.buttonHeightCompact },
  large: { minHeight: theme.layout.buttonHeightLarge },
  labels: { alignItems: 'center' },
  largeLabel: { lineHeight: 24 },

  primary: { backgroundColor: theme.colors.accent },
  primaryPressed: { backgroundColor: theme.colors.accentPressed },
  secondary: {
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
  },
  secondaryPressed: { backgroundColor: theme.colors.surface },
  ghost: { minHeight: theme.layout.minTouchTarget },
  ghostPressed: { opacity: 0.6 },
  disabled: { backgroundColor: theme.colors.surface, borderColor: theme.colors.surface },
}));
