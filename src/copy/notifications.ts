import type { ReminderKind, ReminderMessage, StreakRewardAhead } from '@/features/notifications';
import type { Tone } from '@/features/tone';

/** A line that takes a number, written in all three tones. */
type ToneCount = Record<Tone, (count: number) => string>;

type ReminderText = { title: string; body: string };

const orders = (count: number): string => (count === 1 ? '1 order' : `${count} orders`);

/**
 * Reminder text. Lock screens are public, so it says counts, never the names of the user's orders.
 * Short: titles under 40 characters, bodies under about 110. Roast lines roast the scroll and the
 * excuse, never the person, and end with what to do. A missed day stays calm in every tone.
 */
const reminders = {
  morning: {
    campaign: {
      title: {
        philosopher: 'The day is yours to shape',
        centurion: 'Orders are in, soldier',
        roast: 'Your phone is up. Are you?',
      },
      body: {
        philosopher: (count) => `${orders(count)} wait for you. Begin with one; the rest will follow.`,
        centurion: (count) => `${orders(count)} today. Open Vinco and log the first one.`,
        roast: (count) => `You found the phone fast enough. Now use it well: ${orders(count)} to start.`,
      } satisfies ToneCount,
    },
    ludus: {
      title: {
        philosopher: 'A fresh day of training',
        centurion: 'Training starts now',
        roast: 'Morning. The feed can wait',
      },
      body: {
        philosopher: (count) => `${orders(count)} on your list. Start whenever you are ready.`,
        centurion: (count) => `${orders(count)} on today's list. Log the first one when you're up.`,
        roast: (count) =>
          `The reels will keep. Your ${orders(count)} won't log themselves: tap in and start.`,
      } satisfies ToneCount,
    },
  },
  evening: {
    campaign: {
      title: {
        philosopher: 'Close the day well',
        centurion: 'Seal the day',
        roast: 'Still scrolling? Seal the day',
      },
      body: {
        philosopher: (left) =>
          `${orders(left)} left before the day holds. A little now spares regret tonight.`,
        centurion: (left) => `${orders(left)} still open. Finish them and seal the day.`,
        roast: (left) =>
          `${orders(left)} still open. The feed will be there tomorrow; today won't. Finish now.`,
      } satisfies ToneCount,
    },
    ludus: {
      title: {
        philosopher: 'Keep your run going',
        centurion: "Finish today's list",
        roast: 'The couch is winning',
      },
      body: {
        philosopher: (left) => `${orders(left)} left today. Finish them and your run carries on.`,
        centurion: (left) => `${orders(left)} still open. Close them out and keep your run.`,
        roast: (left) => `${orders(left)} still open. Beat the couch to it: finish them and keep your run.`,
      } satisfies ToneCount,
    },
    /** Replaces the evening body's second half when holding today pays a streak reward. */
    left: {
      philosopher: (left) => `${orders(left)} left.`,
      centurion: (left) => `${orders(left)} still open.`,
      roast: (left) => `${orders(left)} still open, and pay on the table.`,
    } satisfies ToneCount,
  },
  lastCall: {
    title: {
      philosopher: 'Before midnight',
      centurion: 'Last call, soldier',
      roast: 'Your campaign is on life support',
    },
    body: {
      philosopher: (days) =>
        `Your ${days}-day campaign rests on today. There is still time to hold the line.`,
      centurion: (days) => `Your ${days}-day campaign falls at midnight. Hold the line now.`,
      roast: (days) =>
        `${days} days, not to be traded for one evening of scrolling. Open Vinco and hold the line.`,
    } satisfies ToneCount,
  },
  truceWindow: {
    title: {
      philosopher: 'Yesterday slipped. Today decides',
      centurion: 'Call a Truce before midnight',
      roast: 'One miss is not the end',
    },
    body: {
      philosopher: (days) => `A Truce can still save your ${days}-day campaign. Call it before midnight.`,
      centurion: (days) => `Yesterday was missed. A Truce saves your ${days}-day campaign until midnight.`,
      roast: (days) =>
        `Your ${days}-day campaign can still be saved. Call a Truce before midnight, then carry on.`,
    } satisfies ToneCount,
  },
} as const;

/** "Hold today to earn 15 denarii." Neutral in every tone: it is a fact, not a push. */
function rewardLine(reward: StreakRewardAhead): string {
  if (reward.hasTruce && reward.denarii > 0)
    return `Hold today to earn ${reward.denarii} denarii and a Truce.`;
  if (reward.hasTruce) return 'Hold today to earn a Truce.';
  return `Hold today to earn ${reward.denarii} denarii.`;
}

/** Local reminders, the reminders settings sheet, and the Android notification channels. */
export const notificationsCopy = {
  /** The title and body of one planned reminder, in the user's tone. */
  reminder: (message: ReminderMessage, tone: Tone): ReminderText => {
    switch (message.kind) {
      case 'morning': {
        const lines = message.isLudus ? reminders.morning.ludus : reminders.morning.campaign;
        return { title: lines.title[tone], body: lines.body[tone](message.orderCount) };
      }
      case 'evening': {
        const lines = message.isLudus ? reminders.evening.ludus : reminders.evening.campaign;
        const body = message.reward
          ? `${reminders.evening.left[tone](message.ordersLeft)} ${rewardLine(message.reward)}`
          : lines.body[tone](message.ordersLeft);
        return { title: lines.title[tone], body };
      }
      case 'lastCall':
        return {
          title: reminders.lastCall.title[tone],
          body: reminders.lastCall.body[tone](message.campaign),
        };
      case 'truceWindow':
        return {
          title: reminders.truceWindow.title[tone],
          body: reminders.truceWindow.body[tone](message.campaignSaved),
        };
    }
  },

  /** Android notification channels: the names and lines the phone's settings show. */
  channels: {
    reminders: { name: 'Reminders', description: 'Up to three nudges a day: your orders, sealing the day.' },
    announcements: { name: 'News from Vinco', description: 'Now and then: updates and events. Never ads.' },
  },

  /**
   * "Are you up?": posted once, on the first unlock after 3 am while wake-up isn't logged. Needs
   * the guard service (docs/GUARDIANS.md). Tapping it opens Today's wake-up flow.
   */
  wakePrompt: {
    channelName: 'Wake-up check',
    title: {
      philosopher: 'Are you up?',
      centurion: 'Are you up, soldier?',
      roast: 'Are you up, or just scrolling?',
    },
    body: {
      philosopher: 'If the day has begun, mark it. One tap logs your wake-up.',
      centurion: 'Phone is unlocked, so you are awake. Log your wake-up now.',
      roast: 'Your thumb is clearly awake. Point it at Vinco and log your wake-up first.',
    },
  },

  settings: {
    row: 'Reminders',
    on: 'On',
    off: 'Off',
    title: 'Reminders',
    intro: 'At most three a day. Never at night.',
    master: 'Reminders',
    kinds: {
      morning: { label: "Today's orders", detail: '30 min after waking' },
      evening: { label: 'Seal the day', detail: 'At your evening time' },
      lastCall: { label: 'Last call', detail: '10:45 pm, campaign at stake' },
      truceWindow: { label: 'Truce window', detail: 'The morning after a miss' },
    } satisfies Record<ReminderKind, { label: string; detail: string }>,
    eveningTime: 'Evening time',
    eveningHint: '4 pm to 10 pm',
    denied: 'Notifications are off for Vinco on this phone. Turn them on in the phone settings.',
    openSettings: 'Open phone settings',
    done: 'Done',
  },
} as const;
