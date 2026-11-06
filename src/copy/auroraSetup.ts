import type { ToneLines } from './toneLines';

/**
 * Today's invite to set up Aurora (the alarm), and the guided setup flow it opens
 * (/aurora-setup). Short on purpose: one idea per step. Labels for the permissions come from
 * auroraCopy.status, the time, days and missions from guardCopy.aurora.
 */
export const auroraSetupCopy = {
  /** Under the hero while Aurora is off and never set up. */
  invite: {
    line: {
      philosopher: 'Let "Aurora" (the alarm) wake you at your hour.',
      centurion: '"Aurora" (the alarm): no snooze, only the mission.',
      roast: 'Snooze has had its run. Let "Aurora" (the alarm) wake you.',
    } satisfies ToneLines,
    action: 'Set up',
    hint: 'Sets up Aurora, the alarm, in four short steps',
    dismiss: 'Not now',
  },

  intro: {
    title: 'Meet "Aurora"',
    subtitle: {
      philosopher: 'The alarm you stop by rising, not by reaching.',
      centurion: 'The alarm you stop by getting up. Nothing else.',
      roast: "The alarm your thumb can't beat. Your legs can.",
    } satisfies ToneLines,
    points: {
      rings: 'Rings at your wake-up time, on your days.',
      mission: 'No snooze: it stops after a short mission.',
      logs: 'Win it and your wake-up order is logged.',
    },
  },

  when: {
    title: 'When should it ring?',
    subtitle: 'Your wake-up time to start. Change it any time.',
  },

  mission: {
    title: 'How do you stop it?',
    subtitle: 'Pick the mission. Thirty of them and the day is yours.',
  },

  permissions: {
    title: 'Let it ring',
    subtitle: 'An alarm needs these to ring on time, over the lock screen.',
    notificationsWhy: 'The ring and its one button live in a notification.',
    later: 'You can allow these later in the Aurora settings.',
  },

  continue: 'Continue',
  finish: 'Turn on Aurora',

  done: {
    title: 'Aurora is set',
    line: {
      philosopher: 'Tomorrow begins with a promise already made.',
      centurion: 'Set. Be on your feet when it rings.',
      roast: 'Your bed has been notified. Be up when it rings.',
    } satisfies ToneLines,
    firstRing: (label: string): string => `First ring: ${label}`,
    toToday: 'To today',
  },
} as const;
