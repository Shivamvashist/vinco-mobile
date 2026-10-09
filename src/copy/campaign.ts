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
      roast:
        "Streak's gone. Somewhere, your phone is popping champagne. Ruin its party: hold the line today.",
    } satisfies ToneLines,
    history: (days: number): string =>
      days > 0
        ? `Your ${days} ${days === 1 ? 'day stays' : 'days stay'} in your history. Hold the line today and you earn "Resurgo" (I rise again).`
        : 'Hold the line today and you earn "Resurgo" (I rise again).',
    rise: 'Rise again',
  },
  /** Calling a Truce to save the campaign. */
  truce: {
    title: 'Save the campaign',
    fromReserve: (days: number, campaign: number, reserve: number): string =>
      `${days === 1 ? 'A Truce covers the missed day' : `${days} Truces cover the missed days`} and your ${campaign}-day campaign carries on. You hold ${reserve} in reserve.`,
    withPurchase: (days: number, reserve: number, cost: number, denarii: number): string =>
      `${days} missed ${days === 1 ? 'day needs a Truce' : `days need ${days} Truces`} and you hold ${reserve}. The rest cost ${cost} denarii; you have ${denarii}.`,
    cannotAfford: (cost: number, denarii: number): string =>
      `Saving this campaign costs ${cost} denarii and you have ${denarii}. Rise again today and earn more.`,
    action: (days: number): string => (days === 1 ? 'Call a Truce' : `Call ${days} Truces`),
    actionWithCost: (days: number, cost: number): string =>
      `${days === 1 ? 'Call a Truce' : `Call ${days} Truces`} · ${cost} denarii`,
    failed: "The Truce couldn't be called. Nothing was spent. Try again.",
  },
  truced: {
    badge: 'TRUCE',
    title: 'The line holds',
    detail: (campaign: number, reserve: number): string =>
      `Your ${campaign}-day campaign carries on. ${reserve === 0 ? 'No Truces' : `${reserve} ${reserve === 1 ? 'Truce' : 'Truces'}`} left in reserve.`,
    toToday: "To today's orders",
  },
  risen: {
    badge: 'RESURGO',
    title: 'Day I, again',
    detail: (dayRoman: string, lengthRoman: string): string =>
      `Fresh campaign, same arc: you're still on Day ${dayRoman} of ${lengthRoman}. Ranks and history are untouched.`,
    quote: '"Perfer et obdura."',
    quoteMeaning: 'Ovid: be patient and tough.',
    toToday: "To today's orders",
  },
} as const;
