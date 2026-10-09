import type { ArcLength } from '@/features/arc';
import { toRoman } from '@/lib/toRoman';

import type { ToneLines } from './toneLines';

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

/** Onboarding: from Cross the Rubicon to Day I. Text follows the UI prototype. */
export const onboardingCopy = {
  /** "II of V" over the step bar. */
  stepLabel: (step: number, total: number): string => `${toRoman(step)} of ${toRoman(total)}`,
  stepAccessibilityLabel: (step: number, total: number): string => `Step ${step} of ${total}`,
  continue: 'Continue',

  rubicon: {
    wordmark: 'VINCO',
    quotes: [
      { text: 'Begin at once to live.', author: 'Seneca' },
      { text: 'Waste no more time arguing what a good man should be. Be one.', author: 'Marcus Aurelius' },
      { text: 'No man is free who is not master of himself.', author: 'Epictetus' },
    ],
    quoteHint: 'Shows the next quote',
    caption: 'Once you cross, there is no going back. Just like Caesar.',
    cross: 'Cross the Rubicon',
    crossSublabel: 'Begin your arc',
  },

  arc: {
    title: 'How long is your campaign?',
    subtitle: "It starts today. You can't shorten it later, only finish it.",
    options: {
      30: {
        name: 'First campaign',
        description: 'Prove you can hold the line for a month.',
        quip: 'Sensible. Caesar also started small.',
      },
      60: {
        name: 'The winter arc',
        description: 'Through the cold months. Ends just before the new year.',
        quip: "The classic. Most people quit around day 12. You won't.",
      },
      90: {
        name: 'Legend tier',
        description: 'Finish it and earn the rank of Caesar.',
        quip: 'Bold. The Senate has been notified.',
      },
    } satisfies Record<ArcLength, { name: string; description: string; quip: string }>,
    mostChosen: 'Most chosen',
    summary: (todayLabel: string, endLabel: string): string =>
      `Day I is today, ${todayLabel}. Your arc ends ${endLabel}.`,
  },

  orders: {
    title: 'Your orders',
    subtitle:
      'Four non-negotiables, every day. Tune the numbers; the orders stay. Hitting the minimum keeps your campaign alive.',
    holdLabel: 'Hold the line',
    conquerLabel: 'Conquer',
    requiredLabel: 'Required order',
    water: {
      name: 'Water',
      min: '1 L on waking',
      full: (litres: number): string => `${litres} ${plural(litres, 'litre', 'litres')}`,
      adjust: 'Water full goal',
    },
    wake: {
      name: 'Wake-up',
      min: 'Within 15 min',
      adjust: 'Wake-up time',
      note: 'Vinco reminds you at this time. The alarm with missions arrives in a later update.',
    },
    meal: {
      name: 'Protein meal',
      min: '1 meal',
      full: (meals: number): string => `${meals} ${plural(meals, 'meal', 'meals')}`,
      adjust: 'Protein meals full goal',
    },
    workout: {
      name: 'Workout',
      min: '15 min walk',
      full: (minutes: number): string => `${minutes} min`,
      adjust: 'Workout full goal',
      note: "You'll note what you trained when you tick it off.",
    },
    accept: 'Accept my orders',
  },

  tone: {
    title: 'How should Vinco talk to you?',
    subtitle: 'Every nudge and message is written three ways. Change it any time.',
    sender: 'Vinco',
    scenes: [
      {
        label: '9pm, task open',
        time: '9:04 pm',
        lines: {
          philosopher: 'The day is not over. One small act still counts.',
          centurion: 'Two orders still open. Finish the line, soldier.',
          roast:
            'Your water bottle has filed a missing person report and the police want your screen time. Go and drink.',
        } satisfies ToneLines,
      },
      {
        label: 'Missed a day',
        time: '7:30 am',
        lines: {
          philosopher: 'Fall seven times, rise eight. Day I begins again.',
          centurion: 'Campaign lost. Regroup. March at dawn.',
          roast: "Streak's dead. The couch is throwing a victory party. Crash it: Day I starts now.",
        } satisfies ToneLines,
      },
    ],
    descriptions: {
      philosopher: 'Calm Stoic teacher. Seneca at your shoulder.',
      centurion: 'Firm coach. Short orders, no excuses.',
      roast: 'Unhinged friend. Roasts your habits and your phone, never you.',
    } satisfies ToneLines,
  },

  oath: {
    title: 'Take the oath',
    body: 'Why are you doing this? Say it out loud, in your own voice. Vinco plays it back on Day X, the day most people quit.',
    prompts: (arcLength: number): string[] => [
      'Who are you doing this for?',
      `What does Day ${arcLength} you look like?`,
      'What are you done with?',
    ],
    timer: (seconds: number, limit: number): string =>
      `0:${String(seconds).padStart(2, '0')} / 0:${String(limit).padStart(2, '0')}`,
    idleHint: (limit: number): string => `Tap to record. Up to ${limit} seconds.`,
    recordingHint: 'Speak from the gut. Tap to stop.',
    startRecording: 'Start recording',
    stopRecording: 'Stop recording',
    sealedTitle: 'Oath sealed',
    sealedDetail: (seconds: number): string =>
      `0:${String(seconds).padStart(2, '0')} recorded. It opens on Day X.`,
    sealedResumed: 'Recorded. It opens on Day X.',
    recordAgain: 'Record again',
    skip: 'Skip for now',
    permissionDenied:
      "Vinco can't use the microphone. Allow it in Settings to record your oath, or skip it for now.",
    openSettings: 'Open settings',
    failed: "The recording didn't save. Try once more, or skip for now.",
  },

  selfie: {
    title: 'Your first proof',
    body: (arcLengthRoman: string): string =>
      `One photo a day. It never leaves your phone. On Day ${arcLengthRoman} it becomes your timelapse.`,
    stamp: 'DAY I',
    quote: '"Alea iacta est."',
    quoteMeaning: 'Caesar, crossing the Rubicon: the die is cast.',
    march: 'March to Today',
    skip: 'Start without a selfie',
    finishFailed: "Your arc couldn't be saved. Try again; your choices are kept.",
  },
} as const;
