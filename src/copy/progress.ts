import { tabsCopy } from './tabs';
import type { ToneLines } from './toneLines';

/** The Vidi (Progress) tab. */
export const progressCopy = {
  eyebrow: `${tabsCopy.vidi.latin} · ${tabsCopy.vidi.meaning}`,
  title: 'Your proof',

  /** Shown until the first day is sealed. */
  emptyLine: {
    philosopher: 'Proof is built one day at a time. Your calendar and selfies will gather here.',
    centurion: 'No proof on record. Seal your first day and it starts here.',
    roast: 'Current proof: zero selfies and a lot of confidence. Seal one day and this starts filling up.',
  } satisfies ToneLines,
} as const;
