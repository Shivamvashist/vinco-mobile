import { useShallow } from 'zustand/react/shallow';

import type { ReminderKind, ReminderSettings } from '@/features/notifications';
import type { NotificationPermission } from '@/notifications';
import { selectReminderSettings, useRemindersStore } from '@/stores';

import { useNotificationPermission } from './useNotificationPermission';

export type ReminderControls = {
  settings: ReminderSettings;
  /** Null while it is being read. */
  permission: NotificationPermission | null;
  /** Turning on asks for the permission first; stays off if the phone refuses. Returns the result. */
  setOn: (isOn: boolean) => Promise<boolean>;
  setKind: (kind: ReminderKind, isOn: boolean) => void;
  setEveningMinutes: (minutes: number) => void;
  /** Asks again (from the Permissions screen or the sheet). */
  requestPermission: () => Promise<NotificationPermission>;
};

/** The reminder settings and the permission behind them, for the Reminders sheet. */
export function useReminderControls(): ReminderControls {
  const settings = useRemindersStore(useShallow(selectReminderSettings));
  const store = useRemindersStore(
    useShallow((state) => ({
      setOn: state.setOn,
      setKind: state.setKind,
      setEveningMinutes: state.setEveningMinutes,
    })),
  );
  const { permission, request } = useNotificationPermission();

  return {
    settings,
    permission,
    setOn: async (isOn) => {
      if (!isOn) {
        store.setOn(false);
        return false;
      }
      const current = permission?.status === 'granted' ? permission : await request();
      store.setOn(current.status === 'granted');
      return current.status === 'granted';
    },
    setKind: store.setKind,
    setEveningMinutes: store.setEveningMinutes,
    requestPermission: request,
  };
}
