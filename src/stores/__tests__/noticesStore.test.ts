import { sanitizeNotices } from '..';

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
