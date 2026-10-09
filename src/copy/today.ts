import { tabsCopy } from './tabs';
import type { ToneLines } from './toneLines';

/** The Veni (Today) tab. */
export const todayCopy = {
  eyebrow: `${tabsCopy.veni.latin} · ${tabsCopy.veni.meaning}`,

  /** Shown until an arc has begun. */
  emptyLine: {
    philosopher: 'Every arc begins with one step. Cross the Rubicon and your orders will be waiting here.',
    centurion: 'No orders posted yet, soldier. Cross the Rubicon and report back here.',
    roast:
      'Nothing here yet, which suits your phone just fine. Cross the Rubicon and give this screen a job.',
  } satisfies ToneLines,
} as const;
