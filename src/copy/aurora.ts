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
      centurion: 'On your feet. Open Vinco and finish the mission to stop the alarm.',
      roast: 'The snooze button is a myth here. Open Vinco and earn the silence.',
    } satisfies ToneLines,
    action: 'Open the mission',
    timedOutTitle: 'Aurora stopped',
    timedOutBody: 'It rang for 10 minutes. Log your wake-up when you are up.',
  },

  ring: {
    eyebrow: '"Aurora" · Rise',
    /** Under the clock while it rings, per mission. */
    line: {
      march: {
        philosopher: 'You chose this hour last night. Honour that choice now.',
        centurion: 'Up. Thirty steps and the day is yours.',
        roast: 'Your bed is not a campaign. Thirty steps, then you can be dramatic about it.',
      },
      gladius: {
        philosopher: 'A blade left in its sheath grows dull. Draw it thirty times and wake.',
        centurion: 'Blade up. Thirty swings and the day is yours.',
        roast:
          'That phone has slain a hundred of your mornings. Swing it 30 times and slay this alarm instead.',
      },
    } satisfies Record<'march' | 'gladius', ToneLines>,
    missions: {
      march: {
        title: 'March',
        instruction: 'Walk. Each step counts itself.',
        tapInstruction: 'Tap the button for each step.',
        unit: (count: number): string => (count === 1 ? 'step' : 'steps'),
        tapButton: 'March',
        offerTaps: "Can't walk right now? Tap instead",
        noSensor: 'This phone has no step counter. Tap 30 times instead.',
        noPermission:
          'Steps are not allowed on this phone. Tap instead, and allow "Physical activity" on the Aurora screen.',
        quiet: 'No steps are arriving. Tap instead; steps still count.',
        chosen: 'Taps count now. Steps still add.',
      },
      gladius: {
        title: '"Gladius" · Sword',
        instruction: 'Grip the phone and swing it like a sword.',
        tapInstruction: 'Tap the button for each strike.',
        unit: (count: number): string => (count === 1 ? 'swing' : 'swings'),
        tapButton: 'Strike',
        offerTaps: "Can't swing? Tap instead",
        noSensor: 'No motion sensor on this phone. Tap 30 times instead.',
        noPermission: 'No motion sensor on this phone. Tap 30 times instead.',
        quiet: 'No swings are arriving. Tap instead; swings still count.',
        chosen: 'Taps count now. Swings still add.',
      },
    },
    left: (left: number, unit: string): string => `${left} ${unit} to go`,
    progress: (count: number, goal: number, unit: string): string => `${count} of ${goal} ${unit}`,
    tapHint: 'Counts one of the 30',
    soon: (mission: string): string => `"${mission}" arrives soon. Today it is the march.`,
    asking: 'Waking the sensor',
    sick: "I'm sick",
    sickHint: 'Stops the alarm and calls a sick-day Truce',
    sickLudus: 'Stops the alarm. Rest well.',
    sickCannotAfford: (cost: number, denarii: number): string =>
      `No Truces left, and one costs ${cost} denarii (you have ${denarii}). Finish the mission, or use an alarm pass.`,
    sickFailed: "The Truce couldn't be called. Nothing was spent. Try again, or finish the mission.",
    pass: (held: number): string => `Use an alarm pass (${held} held)`,
    passHint: 'Stops the alarm without the mission',
    passFailed: "The pass couldn't be used. Nothing was spent. Try again, or finish the mission.",
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
    stepCounter: 'Step counter',
    stepCounterWhy: 'March counts your steps with "Physical activity". Without it, you tap 30 times.',
    allowSteps: 'Allow the step counter',
    openSettings: 'Open settings',
    noStepCounter: 'This phone has no step counter: March counts taps.',
  },
} as const;
