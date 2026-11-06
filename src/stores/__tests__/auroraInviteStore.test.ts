import { sanitizeAuroraInvite } from '../auroraInviteStore';

describe('aurora invite store', () => {
  it('shows the invite unless a valid save closed it', () => {
    expect(sanitizeAuroraInvite({ isClosed: true })).toEqual({ isClosed: true });
    expect(sanitizeAuroraInvite({ isClosed: 'yes' })).toEqual({ isClosed: false });
    expect(sanitizeAuroraInvite(null)).toEqual({ isClosed: false });
  });
});
