/**
 * The three voices Vinco can speak in. Every nudge and empty state is written in all three.
 * Philosopher: calm Stoic teacher. Centurion: firm coach. Roast: sarcastic friend.
 */
export const TONES = ['philosopher', 'centurion', 'roast'] as const;

export type Tone = (typeof TONES)[number];

/** Used until the user picks a tone in onboarding. */
export const DEFAULT_TONE: Tone = 'centurion';

export function isTone(value: unknown): value is Tone {
  return typeof value === 'string' && (TONES as readonly string[]).includes(value);
}
