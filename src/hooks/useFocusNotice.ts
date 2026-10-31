import { useEffect } from 'react';

import { notify } from '@/components/notices';
import { focusCopy } from '@/copy';
import { guardBridge } from '@/features/guard';

/** One id, so a burst of guard events replaces the notice instead of queueing behind it. */
const NOTICE_ID = 'focus-guard';

/**
 * What the native guard just did on the running focus (a nudge, an app blocked or closed), as a
 * warning notice. Listens only while `isListening` (a focus runs on screen).
 */
export function useFocusNotice(isListening: boolean): void {
  useEffect(() => {
    if (!isListening) return;
    return guardBridge.onFocusEvent((event) => {
      notify({ kind: 'warning', message: focusCopy.active.events[event.type], id: NOTICE_ID });
    });
  }, [isListening]);
}
