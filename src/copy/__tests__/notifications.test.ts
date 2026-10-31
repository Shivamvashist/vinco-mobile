import type { ReminderMessage } from '@/features/notifications';
import { TONES } from '@/features/tone';

import { notificationsCopy } from '..';

/** Every message shape, with numbers wide enough to test the longest lines. */
const MESSAGES: ReminderMessage[] = [
  { kind: 'morning', isLudus: false, orderCount: 10 },
  { kind: 'morning', isLudus: true, orderCount: 1 },
  { kind: 'evening', isLudus: false, ordersLeft: 10, reward: null },
  { kind: 'evening', isLudus: true, ordersLeft: 3, reward: null },
  { kind: 'evening', isLudus: false, ordersLeft: 10, reward: { denarii: 125, hasTruce: true } },
  { kind: 'evening', isLudus: false, ordersLeft: 1, reward: { denarii: 0, hasTruce: true } },
  { kind: 'evening', isLudus: true, ordersLeft: 2, reward: { denarii: 15, hasTruce: false } },
  { kind: 'lastCall', campaign: 100 },
  { kind: 'truceWindow', campaignSaved: 100 },
];

describe('notificationsCopy.reminder', () => {
  it('words every reminder in every tone, short enough for a notification', () => {
    for (const message of MESSAGES) {
      for (const tone of TONES) {
        const { title, body } = notificationsCopy.reminder(message, tone);
        expect(title.trim().length).toBeGreaterThan(0);
        expect(body.trim().length).toBeGreaterThan(0);
        expect(title.length).toBeLessThanOrEqual(40);
        expect(body.length).toBeLessThanOrEqual(110);
      }
    }
  });

  it('says counts, with the right plural', () => {
    expect(
      notificationsCopy.reminder({ kind: 'morning', isLudus: false, orderCount: 1 }, 'centurion').body,
    ).toBe('1 order today. Open Vinco and log the first one.');
    expect(
      notificationsCopy.reminder(
        { kind: 'evening', isLudus: false, ordersLeft: 2, reward: null },
        'centurion',
      ).body,
    ).toBe('2 orders still open. Finish them and seal the day.');
  });

  it('folds a streak reward into the evening line', () => {
    const reward = { denarii: 25, hasTruce: true };
    expect(
      notificationsCopy.reminder({ kind: 'evening', isLudus: false, ordersLeft: 2, reward }, 'philosopher')
        .body,
    ).toBe('2 orders left. Hold today to earn 25 denarii and a Truce.');
  });

  it('writes the tones differently', () => {
    for (const message of MESSAGES) {
      const titles = new Set(TONES.map((tone) => notificationsCopy.reminder(message, tone).title));
      expect(titles.size).toBe(TONES.length);
    }
  });
});
