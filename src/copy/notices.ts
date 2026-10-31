import type { NoticeKind } from '@/features/notices';

/** The in-app notices at the top of the screen (components/notices). */
export const noticesCopy = {
  /** The same notice again while it shows: "x2". */
  count: (count: number): string => `x${count}`,
  /** What a screen reader says before the message, so the kind is heard as well as seen. */
  kinds: {
    success: 'Done',
    reward: 'Reward',
    info: 'Note',
    warning: 'Heads up',
    error: 'Problem',
  } satisfies Record<NoticeKind, string>,
  spoken: (kind: string, message: string, count: number): string =>
    count > 1 ? `${kind}: ${message} (${count} times)` : `${kind}: ${message}`,
  dismissHint: 'Double tap to dismiss.',
};
