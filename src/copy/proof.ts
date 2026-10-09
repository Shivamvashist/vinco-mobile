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

  todayTile: {
    title: "Today's selfie",
    notTaken: 'Take it now: 10 seconds, stays on this phone',
    taken: 'Taken. See you tomorrow.',
  },

  weightTile: {
    title: 'Body weight',
    notLogged: 'Log it: kilograms, any time today',
    last: (kg: string, dayLabel: string): string => `Last: ${kg} kg on ${dayLabel}`,
    today: (kg: string): string => `${kg} kg today`,
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

  /** Kilograms as shown: one decimal at most, no trailing zero. */
  kg: (value: number): string => `${Number(value.toFixed(1))}`,
} as const;
