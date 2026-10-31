import { act } from '@testing-library/react-native';

import { DEFAULT_REMINDERS_STATE, sanitizeReminders, useRemindersStore } from '../remindersStore';

describe('reminders store', () => {
  beforeEach(() => useRemindersStore.setState(DEFAULT_REMINDERS_STATE));

  it('restores only valid values', () => {
    expect(sanitizeReminders(null)).toEqual(DEFAULT_REMINDERS_STATE);
    expect(
      sanitizeReminders({
        isOn: 'yes',
        hasAskedPermission: 1,
        pushToken: '   ',
        eveningMinutes: 5000,
      }),
    ).toEqual({ ...DEFAULT_REMINDERS_STATE, eveningMinutes: 22 * 60 });
    expect(
      sanitizeReminders({ hasAskedPermission: true, pushToken: 'ExponentPushToken[abc]' }),
    ).toMatchObject({
      hasAskedPermission: true,
      pushToken: 'ExponentPushToken[abc]',
    });
    expect(sanitizeReminders({ pushToken: 'x'.repeat(500) }).pushToken).toBeNull();
  });

  it('changes settings through its actions, keeping them valid', () => {
    act(() => {
      const store = useRemindersStore.getState();
      store.setOn(false);
      store.setKind('lastCall', false);
      store.setEveningMinutes(3 * 60);
      store.markPermissionAsked();
      store.setPushToken('ExponentPushToken[abc]');
    });
    const state = useRemindersStore.getState();
    expect(state.isOn).toBe(false);
    expect(state.kinds.lastCall).toBe(false);
    expect(state.kinds.evening).toBe(true);
    expect(state.eveningMinutes).toBe(16 * 60);
    expect(state.hasAskedPermission).toBe(true);
    expect(state.pushToken).toBe('ExponentPushToken[abc]');
  });

  it('ignores an unknown kind', () => {
    act(() => useRemindersStore.getState().setKind('nonsense' as never, false));
    expect(useRemindersStore.getState().kinds).toEqual(DEFAULT_REMINDERS_STATE.kinds);
  });
});
