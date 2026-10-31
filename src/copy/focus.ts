import type { FocusGuard } from '@/features/focus';
import type { Tone } from '@/features/tone';

import type { ToneLines } from './toneLines';

type GuardText = { name: string; plain: string; does: string };

/**
 * Focus ("Acies", the battle line). The voice changes only where it matters (the setup line, the
 * completion and its notification). Giving up stays neutral in every tone: it says plainly that it
 * pays nothing, and nothing more.
 */
export const focusCopy = {
  cta: {
    title: 'Focus',
    subtitle: '"Acies" · guard your time',
    ready: 'Ready',
    left: (clock: string): string => `${clock} left`,
    label: 'Focus, "Acies", guard your time. Ready.',
    runningLabel: (clock: string): string => `Focus running, ${clock} left.`,
    hint: 'Opens the focus view.',
  },

  setup: {
    eyebrow: '"Acies" · Focus',
    title: 'Guard your time',
    subtitle: {
      philosopher: 'Choose the time and keep it. The mind follows where the hand stays.',
      centurion: 'Set the time, pick the guard, hold the line to the end.',
      roast: 'The feed will survive without you. Pick a time and prove it.',
    } satisfies ToneLines,
    close: 'Close focus',
    minutesUnit: 'min',
    minutes: (minutes: number): string => `${minutes} minutes`,
    rulerLabel: 'Focus length',
    rulerHint: 'Swipe up or down to change it by 5 minutes.',
    presetsLabel: 'Quick lengths',
    guardSection: 'Guard',
    guards: {
      custos: { name: '"Custos"', plain: 'Limit apps', does: 'Marked apps allowed for 5 minutes in all.' },
      imperium: { name: '"Imperium"', plain: 'Block apps', does: 'Marked apps blocked.' },
      silentium: {
        name: '"Silentium"',
        plain: 'Block everything',
        does: 'Everything but calls, messages and Vinco.',
      },
    } satisfies Record<FocusGuard, GuardText>,
    rate: (perTenMinutes: number): string => `${perTenMinutes} denarii per 10 min`,
    notYet: 'Blocking arrives with the Vigil. The timer and the reward work now.',
    reward: (denarii: number): string => `Hold the line to the end: +${denarii} denarii`,
    rewardTooShort: 'Ten minutes or more earn denarii.',
    rewardDailyLimit: 'Three focuses paid today. This one is for the work itself.',
    begin: 'Begin',
    busy: 'A focus is already running.',
    failed: 'The focus could not start. Try again.',
  },

  running: {
    eyebrow: (guardName: string): string => `"Acies" · ${guardName}`,
    left: 'left',
    endsAt: (time: string): string => `Ends at ${time}`,
    timeLeftLabel: (clock: string): string => `${clock} left`,
    minimise: 'Minimise focus',
    retreat: 'Hold to retreat',
    retreatHint: 'Hold for a second and a half to give up. Giving up pays nothing.',
  },

  complete: {
    title: 'Line held',
    earned: (denarii: number): string => `+${denarii} denarii`,
    minutesHeld: (minutes: number): string => `${minutes} minutes held`,
    line: {
      philosopher: 'You kept the time you promised yourself. That is the whole of it.',
      centurion: 'Line held. That is how it is done. Again tomorrow.',
      roast: 'The phone lost this round. Bank it and do it again tomorrow.',
    } satisfies ToneLines,
    tooShort: 'Under 10 minutes, so no denarii this time.',
    dailyLimit: 'Three focuses were already paid today. The work still counts.',
    retreatTitle: 'Retreated',
    retreatBody: 'This focus was given up. It pays nothing.',
    done: 'Done',
  },

  notification: {
    title: 'Focus held',
    body: (denarii: number, tone: Tone): string => {
      if (denarii <= 0) return 'Time is up. Open Vinco to close it.';
      const lines: ToneLines = {
        philosopher: `+${denarii} denarii waiting. The time was yours.`,
        centurion: `+${denarii} denarii waiting. Open Vinco to collect.`,
        roast: `+${denarii} denarii waiting. The feed lost: come and collect.`,
      };
      return lines[tone];
    },
  },
};
