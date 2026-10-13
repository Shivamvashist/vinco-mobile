import { oathPlaysOn, sanitizeNotices, useNoticesStore } from '..';

const NO_PLAYS = { day: null, count: 0 };

describe('sanitizeNotices', () => {
  it('keeps a real day and drops anything else', () => {
    expect(sanitizeNotices({ acknowledgedLossDay: '2026-10-14' })).toEqual({
      acknowledgedLossDay: '2026-10-14',
      oathPlays: NO_PLAYS,
    });
    expect(sanitizeNotices({ acknowledgedLossDay: '2026-02-30' }).acknowledgedLossDay).toBeNull();
    expect(sanitizeNotices({ acknowledgedLossDay: 5 }).acknowledgedLossDay).toBeNull();
    expect(sanitizeNotices(null)).toEqual({ acknowledgedLossDay: null, oathPlays: NO_PLAYS });
  });

  it('keeps oath plays only for a real day and a whole count', () => {
    expect(sanitizeNotices({ oathPlays: { day: '2026-10-13', count: 2 } }).oathPlays).toEqual({
      day: '2026-10-13',
      count: 2,
    });
    expect(sanitizeNotices({ oathPlays: { day: 'nope', count: 2 } }).oathPlays).toEqual(NO_PLAYS);
    expect(sanitizeNotices({ oathPlays: { day: '2026-10-13', count: -1.5 } }).oathPlays).toEqual({
      day: '2026-10-13',
      count: 0,
    });
  });
});

describe('oath plays', () => {
  afterEach(() => useNoticesStore.getState().reset());

  it('counts plays per day and starts again the next day', () => {
    const { recordOathPlay } = useNoticesStore.getState();
    recordOathPlay('2026-10-13');
    recordOathPlay('2026-10-13');
    expect(oathPlaysOn(useNoticesStore.getState(), '2026-10-13')).toBe(2);
    expect(oathPlaysOn(useNoticesStore.getState(), '2026-10-14')).toBe(0);
    recordOathPlay('2026-10-14');
    expect(oathPlaysOn(useNoticesStore.getState(), '2026-10-14')).toBe(1);
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
