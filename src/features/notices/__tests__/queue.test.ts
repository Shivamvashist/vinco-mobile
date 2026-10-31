import {
  dismissFromQueue,
  EMPTY_NOTICE_QUEUE,
  enqueueNotice,
  keepOnlyErrors,
  type NoticeInput,
  type NoticeQueue,
  NOTICE_TIMING,
} from '..';

const NOW = 1_000_000;

const add = (queue: NoticeQueue, input: NoticeInput, now = NOW) => enqueueNotice(queue, input, now);

describe('the notice queue', () => {
  it('shows the first notice at once with a short timer', () => {
    const queue = add(EMPTY_NOTICE_QUEUE, { kind: 'success', message: 'Bought.' });
    expect(queue.visible?.message).toBe('Bought.');
    expect(queue.visible?.expiresAt).toBe(NOW + NOTICE_TIMING.shortMs);
    expect(queue.waiting).toEqual([]);
  });

  it('gives a notice with an action longer, and an error no timer', () => {
    const withAction = add(EMPTY_NOTICE_QUEUE, {
      kind: 'info',
      message: 'Saved.',
      action: { label: 'Undo', onPress: () => undefined },
    });
    expect(withAction.visible?.expiresAt).toBe(NOW + NOTICE_TIMING.withActionMs);
    const error = add(EMPTY_NOTICE_QUEUE, { kind: 'error', message: 'Could not save.' });
    expect(error.visible?.expiresAt).toBeNull();
  });

  it('ignores an empty message', () => {
    expect(add(EMPTY_NOTICE_QUEUE, { kind: 'info', message: '   ' })).toBe(EMPTY_NOTICE_QUEUE);
  });

  it('merges the same message while it shows: counts it and refreshes the timer', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'reward', message: '+5 denarii' });
    const firstSeq = queue.visible?.seq;
    queue = add(queue, { kind: 'reward', message: '+5 denarii' }, NOW + 2000);
    expect(queue.visible?.count).toBe(2);
    expect(queue.visible?.expiresAt).toBe(NOW + 2000 + NOTICE_TIMING.shortMs);
    expect(queue.visible?.seq).not.toBe(firstSeq);
    expect(queue.waiting).toEqual([]);
  });

  it('replaces a notice with the same id without counting a new message', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'reward', message: '+5 denarii', id: 'pay' });
    queue = add(queue, { kind: 'info', message: '5 denarii taken back', id: 'pay' });
    expect(queue.visible).toMatchObject({ message: '5 denarii taken back', kind: 'info', count: 1 });
  });

  it('queues others one at a time and merges a duplicate that is waiting', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'success', message: 'One' });
    queue = add(queue, { kind: 'info', message: 'Two' });
    queue = add(queue, { kind: 'info', message: 'Two' });
    expect(queue.visible?.message).toBe('One');
    expect(queue.waiting).toHaveLength(1);
    expect(queue.waiting[0]?.count).toBe(2);
  });

  it('lets an error jump the queue and puts the displaced notice back first', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'success', message: 'One' });
    queue = add(queue, { kind: 'info', message: 'Two' });
    queue = add(queue, { kind: 'error', message: 'Broken' });
    expect(queue.visible?.message).toBe('Broken');
    expect(queue.waiting.map((notice) => notice.message)).toEqual(['One', 'Two']);
    expect(queue.waiting[0]?.expiresAt).toBeNull();
  });

  it('lines a second error up behind the first, ahead of the rest', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'error', message: 'First' });
    queue = add(queue, { kind: 'info', message: 'Later' });
    queue = add(queue, { kind: 'error', message: 'Second' });
    expect(queue.visible?.message).toBe('First');
    expect(queue.waiting.map((notice) => notice.message)).toEqual(['Second', 'Later']);
  });

  it('starts the next one with a fresh timer when the first goes', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'success', message: 'One' });
    queue = add(queue, { kind: 'info', message: 'Two' });
    expect(queue.waiting[0]?.expiresAt).toBeNull();
    const later = NOW + NOTICE_TIMING.shortMs;
    const next = dismissFromQueue(queue, queue.visible?.key ?? '', later);
    expect(next.visible?.message).toBe('Two');
    expect(next.visible?.expiresAt).toBe(later + NOTICE_TIMING.shortMs);
    expect(next.visible?.seq).toBeGreaterThan(queue.seq);
    expect(dismissFromQueue(next, next.visible?.key ?? '', later).visible).toBeNull();
  });

  it('keeps an error until it is dismissed', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'error', message: 'Broken' });
    queue = add(queue, { kind: 'info', message: 'After' });
    expect(queue.visible).toMatchObject({ message: 'Broken', expiresAt: null });
    const key = queue.visible?.key ?? '';
    expect(dismissFromQueue(queue, key, NOW).visible?.message).toBe('After');
  });

  it('dismisses a waiting notice by its id, and ignores an unknown one', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'info', message: 'One' });
    queue = add(queue, { kind: 'info', message: 'Two', id: 'two' });
    expect(dismissFromQueue(queue, 'two', NOW).waiting).toEqual([]);
    expect(dismissFromQueue(queue, 'nope', NOW)).toBe(queue);
  });

  it('keeps the line short, dropping the oldest that is not an error', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'info', message: 'Shown' });
    queue = add(queue, { kind: 'error', message: 'E' });
    for (let index = 0; index < 6; index += 1) queue = add(queue, { kind: 'info', message: `N${index}` });
    expect(queue.waiting).toHaveLength(NOTICE_TIMING.maxWaiting);
    expect(queue.waiting.map((notice) => notice.message)).toEqual(['N2', 'N3', 'N4', 'N5']);
  });

  it('keeps only errors when the app goes to the background', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'success', message: 'One' });
    queue = add(queue, { kind: 'info', message: 'Two' });
    expect(keepOnlyErrors(queue, NOW)).toMatchObject({ visible: null, waiting: [] });
    queue = add(queue, { kind: 'error', message: 'Broken' });
    const kept = keepOnlyErrors(queue, NOW);
    expect(kept.visible?.message).toBe('Broken');
    expect(kept.waiting).toEqual([]);
  });

  it('puts a waiting error on screen when the app goes to the background', () => {
    let queue = add(EMPTY_NOTICE_QUEUE, { kind: 'error', message: 'First' });
    queue = add(queue, { kind: 'error', message: 'Second' });
    queue = dismissFromQueue(queue, queue.visible?.key ?? '', NOW);
    queue = add(queue, { kind: 'info', message: 'Passing' });
    expect(keepOnlyErrors(queue, NOW).visible?.message).toBe('Second');
  });
});
