/**
 * In-app notices: the queue's rules, pure. One notice on screen at a time; the same message (or
 * the same id) merges instead of stacking; an error jumps the queue and stays until dismissed or
 * acted on; the others leave by themselves after a few seconds. Time is passed in (`now`, in ms).
 * The screen side lives in components/notices. See docs/DESIGN-SYSTEM.md, "Notices".
 */

export type NoticeKind = 'success' | 'reward' | 'info' | 'warning' | 'error';

export type NoticeAction = { label: string; onPress: () => void };

export type NoticeInput = {
  kind: NoticeKind;
  message: string;
  action?: NoticeAction;
  /** Names the notice, so a later one with the same id replaces it and dismissNotice can find it. */
  id?: string;
};

export type Notice = {
  /** The id given, or the kind and message: equal keys merge. */
  key: string;
  kind: NoticeKind;
  message: string;
  action?: NoticeAction;
  /** How many times the same message arrived while it waited or showed (shown as x2 and up). */
  count: number;
  /** Rises with every new or refreshed notice, so the screen can tell a fresh show from a rerender. */
  seq: number;
  /** When it leaves by itself, or null while it waits or when it stays (an error). */
  expiresAt: number | null;
};

export type NoticeQueue = {
  visible: Notice | null;
  /** Next in line; errors first. */
  waiting: readonly Notice[];
  /** The last seq handed out. */
  seq: number;
};

export const NOTICE_TIMING = {
  /** A plain notice. */
  shortMs: 3000,
  /** A notice with an action: time to read it and reach the button. */
  withActionMs: 5000,
  /** At most this many wait; past it the oldest that isn't an error is dropped. */
  maxWaiting: 4,
} as const;

export const EMPTY_NOTICE_QUEUE: NoticeQueue = { visible: null, waiting: [], seq: 0 };

/** The key a notice merges on: its id, or its kind and message. */
export function noticeKey(input: Pick<NoticeInput, 'kind' | 'message' | 'id'>): string {
  return input.id ?? `${input.kind}:${input.message}`;
}

/** How long a notice stays by itself: null for an error (it waits for the user). */
export function noticeDuration(notice: Pick<Notice, 'kind' | 'action'>): number | null {
  if (notice.kind === 'error') return null;
  return notice.action ? NOTICE_TIMING.withActionMs : NOTICE_TIMING.shortMs;
}

/** Adds a notice: merges with an equal one, shows it now if the screen is free or it is an error. */
export function enqueueNotice(queue: NoticeQueue, input: NoticeInput, now: number): NoticeQueue {
  const message = input.message.trim();
  if (message.length === 0) return queue;
  const key = noticeKey({ ...input, message });
  const seq = queue.seq + 1;
  const merge = (current: Notice): Notice => ({
    ...current,
    kind: input.kind,
    message,
    action: input.action,
    count: current.message === message ? current.count + 1 : 1,
    seq,
  });

  if (queue.visible?.key === key) {
    const merged = merge(queue.visible);
    return { ...queue, seq, visible: withTimer(merged, now) };
  }
  const waitingIndex = queue.waiting.findIndex((notice) => notice.key === key);
  if (waitingIndex >= 0) {
    const waiting = queue.waiting.filter((_, index) => index !== waitingIndex);
    const merged = merge(queue.waiting[waitingIndex] as Notice);
    return enqueueFresh({ ...queue, seq, waiting }, merged, now);
  }
  const fresh: Notice = {
    key,
    kind: input.kind,
    message,
    action: input.action,
    count: 1,
    seq,
    expiresAt: null,
  };
  return enqueueFresh({ ...queue, seq }, fresh, now);
}

/**
 * Takes a notice away (on screen or waiting); the next one shows with a fresh timer. The screen
 * calls it when a notice's time is up (expiresAt), or when it is swiped, tapped or acted on.
 */
export function dismissFromQueue(queue: NoticeQueue, key: string, now: number): NoticeQueue {
  if (queue.visible?.key === key) return showNext({ ...queue, visible: null }, now);
  if (!queue.waiting.some((notice) => notice.key === key)) return queue;
  return { ...queue, waiting: queue.waiting.filter((notice) => notice.key !== key) };
}

/**
 * The app went to the background: what was passing is stale on return, so only errors are kept
 * (they wait for the user). An error on screen gets its turn again.
 */
export function keepOnlyErrors(queue: NoticeQueue, now: number): NoticeQueue {
  const errors = [queue.visible, ...queue.waiting].filter(
    (notice): notice is Notice => notice != null && notice.kind === 'error',
  );
  if (errors.length === 0) return { ...queue, visible: null, waiting: [] };
  if (queue.visible?.kind === 'error') return { ...queue, waiting: errors.slice(1) };
  return showNext({ ...queue, visible: null, waiting: errors }, now);
}

function enqueueFresh(queue: NoticeQueue, notice: Notice, now: number): NoticeQueue {
  const visible = queue.visible;
  if (!visible) return { ...queue, visible: withTimer(notice, now) };
  if (notice.kind === 'error' && visible.kind !== 'error') {
    // The error takes the screen now; what it displaced goes back to the front of the line.
    const displaced = { ...visible, expiresAt: null };
    return { ...queue, visible: withTimer(notice, now), waiting: trim([displaced, ...queue.waiting]) };
  }
  const waiting =
    notice.kind === 'error'
      ? [
          ...queue.waiting.filter((item) => item.kind === 'error'),
          notice,
          ...queue.waiting.filter((item) => item.kind !== 'error'),
        ]
      : [...queue.waiting, notice];
  return { ...queue, waiting: trim(waiting) };
}

function showNext(queue: NoticeQueue, now: number): NoticeQueue {
  const [next, ...rest] = queue.waiting;
  if (!next) return { ...queue, visible: null, waiting: [] };
  const seq = queue.seq + 1;
  return { seq, visible: withTimer({ ...next, seq }, now), waiting: rest };
}

function withTimer(notice: Notice, now: number): Notice {
  const duration = noticeDuration(notice);
  return { ...notice, expiresAt: duration == null ? null : now + duration };
}

/** Keeps the line short: drops the oldest notices that aren't errors first. */
function trim(waiting: readonly Notice[]): Notice[] {
  const kept = [...waiting];
  while (kept.length > NOTICE_TIMING.maxWaiting) {
    const index = kept.findIndex((notice) => notice.kind !== 'error');
    kept.splice(index >= 0 ? index : 0, 1);
  }
  return kept;
}
