import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { createStyles, useReduceMotion } from '@/theme';

import { Txt } from '../Txt';

export type TypingPreviewProps = {
  sender: string;
  time: string;
  /** The full message. Typing restarts whenever it changes. */
  message: string;
};

const CHARACTERS_PER_TICK = 2;
const TICK_MS = 28;

/**
 * A notification-style bubble that types its message out, as a live preview of a tone.
 * With reduced motion the whole message shows at once. Screen readers get the full message.
 */
export function TypingPreview({ sender, time, message }: TypingPreviewProps) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const [typed, setTyped] = useState({ message, length: 0 });

  // A new message starts from nothing (adjusting state during render, no effect).
  if (typed.message !== message) setTyped({ message, length: 0 });
  const length = reduceMotion ? message.length : typed.message === message ? typed.length : 0;

  // One tick at a time until the whole message shows.
  useEffect(() => {
    if (reduceMotion || length >= message.length) return;
    const timer = setTimeout(
      () => setTyped((current) => ({ ...current, length: current.length + CHARACTERS_PER_TICK })),
      TICK_MS,
    );
    return () => clearTimeout(timer);
  }, [length, message, reduceMotion]);

  return (
    <View style={styles.bubble} accessible accessibilityLabel={`${sender}, ${time}: ${message}`}>
      <View style={styles.meta}>
        <View style={styles.avatar}>
          <Txt variant="labelSmall" color="onAccent" style={styles.avatarLetter}>
            {sender.charAt(0)}
          </Txt>
        </View>
        <Txt variant="labelSmall">{sender}</Txt>
        <Txt variant="micro">{time}</Txt>
      </View>
      <Txt variant="body" style={styles.message}>
        {message.slice(0, length)}
        {length < message.length ? (
          <Txt variant="body" color="accent">
            {'|'}
          </Txt>
        ) : null}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  bubble: {
    minHeight: theme.layout.buttonHeight * 1.6,
    paddingVertical: theme.layout.cardPadding,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceRaised,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  avatar: {
    width: theme.space.xl,
    height: theme.space.xl,
    borderRadius: theme.radius.xs + theme.space.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  avatarLetter: { fontFamily: theme.fonts.display },
  message: { marginTop: theme.space.sm },
}));
