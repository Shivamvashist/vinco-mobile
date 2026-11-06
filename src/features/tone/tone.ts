/**
 * The three voices Vinco can speak in. Every nudge and empty state is written in all three.
 * Philosopher: calm Stoic teacher. Centurion: firm coach. Roast: sarcastic friend.
 */
export const TONES = ['philosopher', 'centurion', 'roast'] as const;

export type Tone = (typeof TONES)[number];

/** A new user's tone (Roast me since 2 Nov), until they pick another in Settings. */
export const DEFAULT_TONE: Tone = 'roast';

export function isTone(value: unknown): value is Tone {
  return typeof value === 'string' && (TONES as readonly string[]).includes(value);
}
