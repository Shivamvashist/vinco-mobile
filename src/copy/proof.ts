/**
 * Selfies and weight: the proof. Neutral in every tone (product rule: selfie and weight
 * screens never joke), so nothing here varies by tone.
 */
export const proofCopy = {
  camera: {
    guide: 'Line your face up with the outline',
    ghostGuide: 'Line up with yesterday',
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
    ghostLabel: 'Ghost',
    ghostOptions: { off: 'Off', faint: 'Faint', strong: 'Strong' },
    saved: (dayRoman: string, frames: number, total: number): string =>
      `Day ${dayRoman} saved. ${frames} of ${total} frames for your timelapse.`,
    weightLabel: 'Weight in kg (optional)',
    weightPlaceholder: 'e.g. 72.5',
    weightInvalid: 'Enter a weight between 30 and 250 kg.',
    done: 'Done',
  },

  todayTile: {
    title: "Today's selfie",
    notTaken: 'Not taken yet',
    taken: 'Taken. See you tomorrow.',
  },
} as const;
