/** In-app notices on a real screen: one at a time, errors stay until tapped away, the action acts. */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { notify } from '@/components/notices';
import { noticesCopy } from '@/copy';
import { NOTICE_TIMING } from '@/features/notices';
import { APP_DIR, resetAppState, startArc } from '@/testing/routeKit';

beforeEach(resetAppState);

const spoken = (kind: keyof typeof noticesCopy.kinds, message: string) =>
  noticesCopy.spoken(noticesCopy.kinds[kind], message, 1);

describe('Notices', () => {
  it('shows one at a time, keeps an error until it is tapped, then the next', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/shop' });
    act(() => {
      notify({ kind: 'info', message: 'Passing note' });
      notify({ kind: 'error', message: 'Something broke' });
    });
    // The error jumped the queue.
    expect(await screen.findByText('Something broke')).toBeTruthy();
    expect(screen.queryByText('Passing note')).toBeNull();
    act(() => jest.advanceTimersByTime(NOTICE_TIMING.withActionMs * 3));
    expect(screen.getByText('Something broke')).toBeTruthy();

    fireEvent.press(screen.getByLabelText(spoken('error', 'Something broke')));
    act(() => jest.advanceTimersByTime(1000));
    expect(await screen.findByText('Passing note')).toBeTruthy();
    act(() => jest.advanceTimersByTime(NOTICE_TIMING.shortMs + 1000));
    await waitFor(() => expect(screen.queryByText('Passing note')).toBeNull());
  });

  it('merges a repeat and runs the action once', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/shop' });
    const onPress = jest.fn();
    act(() => {
      notify({ kind: 'reward', message: '+5 denarii', action: { label: 'See', onPress } });
      notify({ kind: 'reward', message: '+5 denarii', action: { label: 'See', onPress } });
    });
    expect(await screen.findByText(noticesCopy.count(2))).toBeTruthy();
    expect(screen.getAllByText('+5 denarii')).toHaveLength(1);
    fireEvent.press(screen.getByLabelText('See'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
