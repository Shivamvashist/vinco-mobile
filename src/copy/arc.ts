import { tabsCopy } from './tabs';
import type { ToneLines } from './toneLines';

/** The Vici (Arc) tab. */
export const arcCopy = {
  eyebrow: `${tabsCopy.vici.latin} · ${tabsCopy.vici.meaning}`,
  title: 'The arc',

  /** Shown until an arc has begun. */
  emptyLine: {
    philosopher: 'The arc is long, and it is yours to walk. Your rank and progress will rise here.',
    centurion: 'No campaign on record. Begin your arc and earn your first rank: Tiro.',
    roast: 'Your current rank is "professional scroller". Begin your arc and earn Tiro instead.',
  } satisfies ToneLines,
} as const;
