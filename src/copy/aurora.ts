import type { ToneLines } from './toneLines';

/**
 * Aurora's ring screen, its notification, and the live status on the Aurora settings screen.
 * The sick and pass lines stay neutral in every tone (a health moment, and a paid choice).
 */
export const auroraCopy = {
  /** The alarm's notification. The phone keeps these for rings while the app is closed. */
  notice: {
    channelName: 'Aurora alarm',
    title: 'Aurora',
    body: {
      philosopher: 'The sun keeps its appointment. Open Vinco and keep yours.',
      centurion: 'On your feet. Open Vinco and march to stop the alarm.',
      roast: 'The snooze button is a myth here. Open Vinco and walk it off.',
    } satisfies ToneLines,
    action: 'Open the mission',
    timedOutTitle: 'Aurora stopped',
    timedOutBody: 'It rang for 10 minutes. Log your wake-up when you are up.',
  },

  ring: {
    eyebrow: '"Aurora" · Rise',
    line: {
      philosopher: 'You chose this hour last night. Honour that choice now.',
      centurion: 'Up. Thirty steps and the day is yours.',
      roast: 'Your bed is not a campaign. Thirty steps, then you can be dramatic about it.',
    } satisfies ToneLines,
    marchTitle: 'March',
    marchSteps: 'Walk 30 steps. They count themselves.',
    marchTaps: 'No step counter here: tap the button 30 times.',
    stepsLeft: (left: number): string => `${left} ${left === 1 ? 'step' : 'steps'} to go`,
    tapsLeft: (left: number): string => `${left} ${left === 1 ? 'tap' : 'taps'} to go`,
    tapButton: 'March',
    tapHint: 'Counts one step of the march',
    soon: (mission: string): string => `"${mission}" arrives soon. Today it is the march.`,
    asking: 'Asking for the step counter',
    sick: "I'm sick",
    sickHint: 'Stops the alarm and calls a sick-day Truce',
    sickLudus: 'Stops the alarm. Rest well.',
    sickCannotAfford: (cost: number, denarii: number): string =>
      `No Truces left, and one costs ${cost} denarii (you have ${denarii}). March, or use an alarm pass.`,
    sickFailed: "The Truce couldn't be called. Nothing was spent. Try again, or march.",
    pass: (held: number): string => `Use an alarm pass (${held} held)`,
    passHint: 'Stops the alarm without the mission',
    passFailed: "The pass couldn't be used. Nothing was spent. Try again, or march.",
    won: {
      philosopher: 'Risen. The day begins with a promise kept.',
      centurion: 'Done. Wake-up logged. Now the orders.',
      roast: 'The bed lost this round. Wake-up logged. Now go win the orders.',
    } satisfies ToneLines,
    firstTry: (denarii: number): string => `First try: +${denarii} denarii`,
    toToday: "To today's orders",
  },

  /** Live status on the Aurora settings screen, in the Vinco build. */
  status: {
    title: 'On this phone',
    nextRing: 'Next ring',
    nothingSet: 'Nothing set',
    allowed: 'Allowed',
    notAllowed: 'Not allowed',
    allow: 'Allow',
    exact: 'Exact alarms',
    exactDetail: 'Without it, Aurora may ring a few minutes late.',
    fullScreen: 'Full-screen alarm',
    fullScreenDetail: 'Shows the alarm over the lock screen.',
    notifications: 'Notifications',
    test: 'Test the alarm in 1 minute',
    testSet: 'Test set: Aurora rings in 1 minute. Lock the phone and wait.',
    testFailed: "The test couldn't be set.",
    soon: 'Soon: rings with the march until then.',
  },
} as const;
