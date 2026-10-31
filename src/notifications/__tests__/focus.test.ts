import * as Notifications from 'expo-notifications';

import { cancelFocusHeld, focusNotificationId, replaceReminders, scheduleFocusHeld } from '..';

const mocked = jest.mocked(Notifications);

beforeEach(() => jest.clearAllMocks());

describe('the focus notification', () => {
  it('is scheduled at the end with its own id', async () => {
    const endsAt = new Date(Date.now() + 25 * 60_000);
    await scheduleFocusHeld({ sessionId: 7, endsAt, title: 'Focus held', body: '+8 denarii waiting.' });
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'vinco.focus.7',
        trigger: expect.objectContaining({ date: endsAt }),
      }),
    );
  });

  it('is not scheduled for an end already past', async () => {
    await scheduleFocusHeld({ sessionId: 7, endsAt: new Date(Date.now() - 1000), title: 't', body: 'b' });
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('survives the reminders being rewritten', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
      { identifier: focusNotificationId(3) } as Notifications.NotificationRequest,
      { identifier: 'vinco.reminder.2026-10-31.evening' } as Notifications.NotificationRequest,
    ]);
    await replaceReminders([]);
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('vinco.reminder.2026-10-31.evening');
  });

  it('is cancelled by its session id', async () => {
    await cancelFocusHeld(3);
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('vinco.focus.3');
  });
});
