import type { ToneLines } from './toneLines';

/** The campaign-lost screen and Resurgo. Text follows the UI prototype. */
export const campaignCopy = {
  lost: {
    eyebrow: (days: number): string =>
      days > 0 ? `Campaign ended · ${days} ${days === 1 ? 'day' : 'days'}` : 'Campaign ended',
    title: 'Yesterday got away.',
    toneLine: {
      philosopher: 'Fall seven times, rise eight. A broken day is not a broken person.',
      centurion: 'Campaign lost. Regroup. The legion marches at dawn, with or without you.',
      roast: "Streak's gone. Your phone is thrilled. Let's disappoint it.",
    } satisfies ToneLines,
    history: (days: number): string =>
      days > 0
        ? `Your ${days} ${days === 1 ? 'day stays' : 'days stay'} in your history. Hold the line today and you earn Resurgo: "I rise again."`
        : 'Hold the line today and you earn Resurgo: "I rise again."',
    rise: 'Rise again',
  },
  risen: {
    badge: 'RESURGO',
    title: 'Day I, again',
    detail: (dayRoman: string, lengthRoman: string): string =>
      `Fresh campaign, same arc: you're still on Day ${dayRoman} of ${lengthRoman}. Ranks and history are untouched.`,
    quote: '"Perfer et obdura; dolor hic tibi proderit olim."',
    quoteMeaning: 'Ovid: be patient and tough; one day this pain will be useful to you.',
    toToday: "To today's orders",
  },
} as const;
