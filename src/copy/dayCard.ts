/** The shareable day card ("Day sealed"). */
export const dayCardCopy = {
  header: 'Day sealed',
  close: 'Close',
  eyebrow: (dayRoman: string, lengthRoman: string): string => `DAY ${dayRoman} OF ${lengthRoman}`,
  rows: {
    water: 'Water',
    wake: 'Wake-up',
    meal: 'Protein meals',
    workout: 'Workout',
  },
  values: {
    litres: (amount: number): string => `${Number(amount.toFixed(2))} L`,
    meals: (count: number): string => String(count),
    minutes: (minutes: number): string => `${minutes} min`,
    notDone: 'Not yet',
  },
  campaign: (days: number): string => `Campaign ${days}`,
  rank: (name: string): string => `Rank: ${name}`,
  wordmark: 'VINCO',
  styleLabel: (name: string): string => `${name} card style`,
  share: 'Share to story',
  shared: 'Day card ready. Go flex, legally.',
  shareUnavailable: "Sharing isn't available on this phone.",
  shareFailed: "The card couldn't be shared. Try again.",
  seeProgress: 'See your progress',
  /** What a screen reader says for the whole card. */
  cardLabel: (dayRoman: string, lengthRoman: string, held: number, total: number): string =>
    `Day card: day ${dayRoman} of ${lengthRoman}, ${held} of ${total} orders held`,
  /** An own order's value on the card: "30 pages". */
  customValue: (amount: number, unit: string): string => (unit ? `${amount} ${unit}` : String(amount)),
} as const;
