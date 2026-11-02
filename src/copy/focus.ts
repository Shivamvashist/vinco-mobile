import type { FocusGuard } from '@/features/focus';
import type { Tone } from '@/features/tone';

import type { ToneLines } from './toneLines';

type GuardText = { name: string; plain: string; level: string; rule: string };

const ROMAN_LEVELS = ['I', 'II', 'III'] as const;

/** "1h 30m", "45m", "2h": a length in the short form the presets and the log use. */
function shortDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** "1 hour 30 minutes": the same length, for screen readers. */
function spokenDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
  const minuteText = rest === 1 ? '1 minute' : `${rest} minutes`;
  if (hours === 0) return minuteText;
  return rest === 0 ? hourText : `${hourText} ${minuteText}`;
}

/**
 * Focus ("Acies", the battle line). One short line per element: the screens show, the words name.
 * The voice changes only where it matters (the empty log, the completion and its notification).
 * Retreating and the Truce it costs stay neutral in every tone.
 */
export const focusCopy = {
  shortDuration,
  spokenDuration,

  tile: {
    title: 'Focus',
    ready: 'Ready',
    readyCaption: '"Acies" · guard your time',
    left: 'left',
    label: 'Focus, "Acies", guard your time. Ready.',
    runningLabel: (clock: string): string => `Focus running, ${clock} left.`,
    hint: 'Opens the focus screen.',
  },

  setup: {
    eyebrow: '"Acies" · Focus',
    title: 'Guard your time',
    close: 'Close focus',
    presetsLabel: 'Quick lengths',
    custom: 'Custom',
    customLabel: 'Custom length',
    rulerLabel: 'Focus length',
    rulerHint: 'Swipe up or down to change it by 5 minutes.',
    guardSection: 'Guard',
    level: (index: number): string => `Level ${ROMAN_LEVELS[index] ?? String(index + 1)}`,
    guards: {
      custos: {
        name: '"Custos"',
        plain: 'Watch',
        level: 'Level I',
        rule: 'Other apps get an alert and a floating timer.',
      },
      imperium: {
        name: '"Imperium"',
        plain: 'Limit',
        level: 'Level II',
        rule: 'Other apps close after 3 minutes, then rest for 3.',
      },
      silentium: {
        name: '"Silentium"',
        plain: 'Lockdown',
        level: 'Level III',
        rule: 'Only your companions and calls. This screen stays.',
      },
    } satisfies Record<FocusGuard, GuardText>,
    notYet: 'Blocking needs the Vinco build. The timer still runs.',
    reward: (denarii: number, gloria: number): string => `+${denarii} denarii · +${gloria} glory points`,
    /** No denarii: under 10 minutes. */
    rewardTooShort: (gloria: number): string => `+${gloria} glory points · denarii from 10 min`,
    /** No denarii: three focuses already paid today. */
    rewardDailyLimit: (gloria: number): string => `+${gloria} glory points · 3 paid today`,
    rewardLabel: (line: string): string => `Hold to the end: ${line}`,
    begin: 'Slide to begin',
    beginHint: 'Slide the knob to the end to begin the focus.',
    busy: 'A focus is already running.',
    failed: 'The focus could not start. Try again.',
  },

  custom: {
    title: 'Custom length',
    hours: 'Hours',
    minutes: 'Minutes',
    hint: 'Any whole minute from 5 minutes to 3 hours.',
    invalid: 'Pick a length from 5 minutes to 3 hours.',
    set: 'Set',
  },

  comites: {
    section: '"Comites" · companions',
    phone: 'Phone',
    add: 'Add an app',
    remove: (label: string): string => `${label}, a companion. Double tap to remove.`,
    pickerTitle: 'Choose your companions',
    search: 'Search apps',
    chosen: (count: number): string => `${count} of 3 chosen`,
    loading: 'Reading your apps...',
    empty: 'No apps match.',
    full: 'Three companions chosen. Remove one to add another.',
    unsupported: 'Your apps arrive with the Vinco build. For now the Phone app is always allowed.',
    done: 'Done',
  },

  permission: {
    title: 'Let the guard watch',
    body: "To guard a focus you start, Vinco uses Android's accessibility service.",
    watches:
      'It sees which app is in front and, in reel apps like Instagram and YouTube, when a new reel scrolls into view. It never reads text, messages or the videos.',
    acts: "During a focus it shows the guard's alerts, closes apps outside the focus, and brings you back here.",
    stays:
      'Only the number of reels a day is kept, on this phone. Nothing is sent off it. Outside a focus it only counts reels.',
    open: 'Turn on the guard',
    openHint: 'Opens the accessibility settings. Find "Vinco focus guard" and turn it on.',
    overlayTitle: 'Show the guard over other apps',
    overlayBody:
      '"Custos" shows its alert and the floating timer over other apps. Allow "Display over other apps".',
    overlayOpen: 'Allow the overlay',
    blockingOff: 'Blocking is off until the permission is on. The timer and the reward still work.',
    /** Android 11+ may offer its own accessibility shortcut bubble for the service; it isn't Vinco's. */
    shortcutTip:
      'If Android shows an accessibility shortcut bubble, you can turn it off in Settings > Accessibility > Vinco focus guard > Shortcut.',
  },

  /** Buying a Truce from the focus screens (the Forum's item, price and limits). Neutral in every tone. */
  truce: {
    title: 'No Truce held',
    retreatLine: 'Ending early spends a Truce.',
    beginLine: "Without one, this focus can't end early.",
    cannotAfford: (short: number): string => `Need ${short} more denarii for a Truce.`,
    dailyLimit: "One Truce a day, and today's is bought.",
    runsOn: 'The focus runs to its end.',
    beginAnyway: 'Begin anyway',
    back: 'Back to the focus',
    bought: 'Truce bought. Slide again to end.',
  },

  log: {
    section: 'Focus log',
    today: 'Today',
    week: 'This week',
    allTime: 'All time',
    empty: {
      philosopher: 'No focus kept yet. The first one is the hardest to begin.',
      centurion: 'No focus on the record. Slide and start one.',
      roast: 'Zero minutes of focus. The phone is winning on points. Start one.',
    } satisfies ToneLines,
    held: 'Held',
    retreated: 'Retreated',
    row: (day: string, time: string, guard: string, minutes: string, result: string): string =>
      `${day}, ${time}, ${guard}, ${minutes}, ${result}.`,
    seeAll: 'See all',
    seeAllLabel: 'See the full focus log, by week, month and year',
  },

  /** The full focus log screen (/focus-log): a week, month or year as bars, totals and sessions. */
  history: {
    eyebrow: '"Acies" · Focus',
    title: 'Focus log',
    back: 'Back',
    legendHeld: 'Held',
    legendRetreated: 'Retreated (time before the retreat)',
    minutesHeld: 'Held',
    sessionsHeld: 'Focuses held',
    sessionsRetreated: 'Retreats',
    bestDay: 'Best day',
    longestRun: 'Days in a row',
    runDays: (days: number): string => (days === 1 ? '1 day' : `${days} days`),
    none: 'None yet',
    guardSplit: 'By guard',
    sessions: 'Sessions',
    describeBar: (name: string, held: number, retreated: number): string =>
      retreated > 0
        ? `${name}: ${spokenDuration(held)} held, ${spokenDuration(retreated)} before a retreat`
        : `${name}: ${spokenDuration(held)} held`,
    barValue: (name: string, held: number, retreated: number): string =>
      retreated > 0
        ? `${name} · ${shortDuration(held)} held · ${shortDuration(retreated)} retreated`
        : `${name} · ${shortDuration(held)} held`,
    guardShare: (guard: string, minutes: number): string => `${guard}, ${spokenDuration(minutes)}`,
    empty: {
      philosopher: 'Nothing kept in this stretch of time. Every stretch can begin with one focus.',
      centurion: 'No focus on the record here. Pick a time and hold it.',
      roast: 'Not one minute of focus here. The scroll had a great time. Start one.',
    } satisfies ToneLines,
  },

  active: {
    timeLeftLabel: (clock: string): string => `${clock} left`,
    /** The one small line under the clock: "Ends 7:40 pm · Limit". */
    meta: (time: string, guard: string): string => (time ? `Ends ${time} · ${guard}` : guard),
    progressLabel: (percent: number): string => `${percent}% of the focus done`,
    truces: 'Truces',
    trucesLabel: (count: number): string => (count === 1 ? '1 Truce held' : `${count} Truces held`),
    buyTruce: 'No Truce held. Buy one',
    buyTruceHint: 'Opens the Truce from the Forum.',
    noTruceAlert: 'No Truce held. Buy one to end early.',
    rainSoundOn: 'Rain sound',
    rainSoundHint: 'Plays soft rain while the focus runs.',
    rainFull: 'Full screen rain',
    rainExit: 'Leave full screen rain',
    minimise: 'Minimise focus',
    locked: 'Lockdown: this screen stays until the focus ends.',
    retreat: 'Slide to retreat',
    retreatHint: 'Spends a Truce. Ending early pays nothing.',
    retreatHintNoTruce: 'No Truce held: buy one first.',
    retreatFailed: 'The retreat could not be saved. Try again.',
    dock: 'Companions',
    phone: 'Phone',
    open: (label: string): string => `Open ${label}`,
    addExplain: 'Companions are chosen before a focus begins.',
    launchFailed: 'That app could not be opened.',
    events: {
      nudge: 'Back to the line.',
      appBlocked: 'That app is outside your focus.',
      appClosed: 'An app was closed to keep the focus.',
    },
    wake: 'Tap anywhere to wake the screen.',
  },

  complete: {
    title: 'Line held',
    earned: (denarii: number): string => `+${denarii} denarii`,
    gloria: (gloria: number): string => `+${gloria} glory points`,
    minutesHeld: (minutes: number): string => `${minutes} minutes held`,
    line: {
      philosopher: 'You kept the time you promised yourself. That is the whole of it.',
      centurion: 'Line held. That is how it is done. Again tomorrow.',
      roast: 'The phone lost this round. Bank it and do it again tomorrow.',
    } satisfies ToneLines,
    tooShort: 'Under 10 minutes, so no denarii this time.',
    dailyLimit: 'Three focuses were already paid today. The work still counts.',
    claim: 'Claim',
    claimLabel: (denarii: number, gloria: number): string =>
      `Claim ${denarii} denarii and ${gloria} glory points`,
    claimed: 'Claimed',
    retreatTitle: 'Retreated',
    retreatBody: 'A Truce spent. It pays nothing.',
    done: 'Done',
  },

  /**
   * The native guard's overlays over other apps and the bubble's focus panel (modules/vigil).
   * Plain and short, the same in every tone: one title, one line, one action.
   */
  overlay: {
    alertTitle: 'Focus is on',
    alertBody: 'This app is outside your focus.',
    nudgeTitle: 'Back to the line',
    nudgeBody: 'Three minutes away from your focus.',
    openVinco: 'Open Vinco',
    backToFocus: 'Back to focus',
    dismiss: 'Not now',
    close: 'Close',
    /** Followed by the countdown: "Closes in 2:41". */
    closingIn: 'Closes in',
    restingTitle: 'This app is resting',
    /** Followed by the time left: "Opens again in 1:20". */
    cooldown: 'Opens again in',
    panelTitle: 'Focus',
    /** Under the big time in the panel: "1:24:07 left". */
    left: 'left',
    /** Followed by the end time: "Ends 7:40 pm". */
    endsAt: 'Ends',
    companions: 'Companions',
    guardCustos: '"Custos" · Level I',
    guardImperium: '"Imperium" · Level II',
    guardSilentium: '"Silentium" · Level III',
    /** The bubble's hint for screen readers. */
    bubbleHint: 'Double tap to see your focus.',
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
