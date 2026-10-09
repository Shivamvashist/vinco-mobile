import { sanitizeNotices, useNoticesStore } from '..';

describe('sanitizeNotices', () => {
  it('keeps a real day and drops anything else', () => {
    expect(sanitizeNotices({ acknowledgedLossDay: '2026-10-14' })).toEqual({
      acknowledgedLossDay: '2026-10-14',
    });
    expect(sanitizeNotices({ acknowledgedLossDay: '2026-02-30' })).toEqual({ acknowledgedLossDay: null });
    expect(sanitizeNotices({ acknowledgedLossDay: 5 })).toEqual({ acknowledgedLossDay: null });
    expect(sanitizeNotices(null)).toEqual({ acknowledgedLossDay: null });
  });
});

describe('useNoticesStore', () => {
  afterEach(() => useNoticesStore.getState().reset());

  it('only moves the acknowledged break forward', () => {
    const { acknowledgeLoss } = useNoticesStore.getState();
    acknowledgeLoss('2026-10-14');
    acknowledgeLoss('2026-10-10');
    expect(useNoticesStore.getState().acknowledgedLossDay).toBe('2026-10-14');
    acknowledgeLoss('2026-10-20');
    expect(useNoticesStore.getState().acknowledgedLossDay).toBe('2026-10-20');
  });

  it('forgets everything on reset', () => {
    useNoticesStore.getState().acknowledgeLoss('2026-10-14');
    useNoticesStore.getState().reset();
    expect(useNoticesStore.getState().acknowledgedLossDay).toBeNull();
  });
});
