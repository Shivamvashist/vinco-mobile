import type { Tone } from '@/features/tone';

/** One line written in all three tones. TypeScript makes sure none is missing. */
export type ToneLines = Record<Tone, string>;

/** Picks the line for the user's tone. */
export function pickTone(lines: ToneLines, tone: Tone): string {
  return lines[tone];
}
