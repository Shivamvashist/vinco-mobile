/**
 * Selfies and weight: the proof. Neutral in every tone (product rule: selfie and weight
 * screens never joke), so nothing here varies by tone.
 */
export const proofCopy = {
  camera: {
    guide: 'Line your face up with the outline',
    ghostGuide: 'Line up with yesterday',
    ghostSlider: "Yesterday's outline",
    ghostValue: (percent: number): string => `${percent}%`,
    reviewQuestion: 'Face inside the outline, like yesterday?',
    reviewQuestionFirst: 'Face inside the outline?',
    looksRight: 'Looks right',
    takeSelfie: 'Take selfie',
    flip: 'Flip camera',
    retake: 'Retake',
    permissionDenied:
      "Vinco needs the camera for your daily selfie. Allow it in Settings, or carry on without today's photo.",
    allowCamera: 'Allow camera',
    openSettings: 'Open settings',
    failed: "The photo didn't save. Try again.",
    privacy: 'Stored only on this phone. Never uploaded.',
  },

  daily: {
    title: (dayRoman: string): string => `Day ${dayRoman}`,
    close: 'Close',
    saved: (dayRoman: string, frames: number, total: number): string =>
      `Day ${dayRoman} saved. ${frames} of ${total} frames for your timelapse.`,
    weightLabel: 'Weight in kg (optional)',
    weightPlaceholder: 'e.g. 72.5',
    weightInvalid: 'Enter a weight between 30 and 250 kg.',
    done: 'Done',
  },

  weightSheet: {
    title: 'Body weight',
    body: 'Weigh at the same time each day for a fair trend. Only weekly averages matter.',
    label: 'Weight in kg',
    placeholder: 'e.g. 72.5',
    save: 'Save weight',
    clear: 'Clear today',
    cancel: 'Not now',
  },

  caloriesSheet: {
    title: 'Calories',
    body: 'Optional. Your total for today, in kcal. It shows beside your weight in Vidi.',
    label: 'Calories today (kcal)',
    placeholder: 'e.g. 1850',
    add: (kcal: number): string => `+${kcal}`,
    addLabel: (kcal: number): string => `Add ${kcal} kcal`,
    invalid: 'Enter a whole number up to 10000.',
    save: 'Save calories',
    clear: 'Clear today',
    cancel: 'Not now',
  },

  /** Calories as shown: "1,850". */
  kcal: (value: number): string => Math.round(value).toLocaleString('en-IN'),

  /** The timelapse player and its entry points. Neutral: it shows change, never judges it. */
  reel: {
    titles: { arc: 'This campaign', all: 'Every selfie' },
    /** In free training there is no campaign: the same reel is "your training". */
    ludusTitle: 'Your training',
    frameLabel: (dayRoman: string, date: string): string => `Day ${dayRoman} · ${date}`,
    counter: (index: number, total: number): string => `${index} / ${total}`,
    play: 'Play',
    pause: 'Pause',
    replay: 'Play again',
    previous: 'Previous selfie',
    next: 'Next selfie',
    close: 'Close',
    tooFew: 'A timelapse needs at least two selfies. Take one each day and it builds itself.',
    /** What a screen reader says for the frame on screen. */
    frameAccessibility: (date: string, index: number, total: number): string =>
      `Selfie from ${date}, ${index} of ${total}`,
    allCard: {
      title: 'All your proof',
      detail: (frames: number, since: string): string =>
        `${frames} ${frames === 1 ? 'selfie' : 'selfies'} since ${since}, across every arc`,
      play: 'Play every selfie',
      empty: 'Your selfies from every arc will gather here.',
    },
  },

  /** Kilograms as shown: one decimal at most, no trailing zero. */
  kg: (value: number): string => `${Number(value.toFixed(1))}`,
} as const;
