/** The reel counter screen (/reels): today, the log, the settings, and the reel pass from the overlay link. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { reelsCopy } from '@/copy';
import { db, getDenariiBalance, nowIso, selectReelPasses } from '@/db';
import { ledger } from '@/db/schema';
import { useGuardStore } from '@/stores';
import { APP_DIR, resetAppState, startArc } from '@/testing/routeKit';

beforeEach(() => {
  resetAppState();
  useGuardStore.getState().reset();
});

function earn(amount: number) {
  db.insert(ledger).values({ day: '2026-01-01', reason: 'day_conquered', amount, createdAt: nowIso() }).run();
}

describe('Reels', () => {
  it('shows today, the log and the settings, and says counting waits for the build', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/reels' });
    expect(await screen.findByText(reelsCopy.title)).toBeTruthy();
    expect(screen.getByText(reelsCopy.status.notYet)).toBeTruthy();
    expect(screen.getByLabelText(reelsCopy.today.label(0, 30))).toBeTruthy();
    expect(screen.getByText(reelsCopy.log.empty)).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Week'));
    expect(await screen.findByLabelText(reelsCopy.log.budgetLineLabel(210))).toBeTruthy();

    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText('Vigil'));
    expect(useGuardStore.getState().level).toBe('vigil');
    fireEvent(screen.getByLabelText(reelsCopy.settings.budgetAdjust), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(useGuardStore.getState().reelBudget).toBe(35);
  });

  it('opens the pass sheet from the overlay link and buys one pass for denarii', async () => {
    startArc();
    earn(50);
    renderRouter(APP_DIR, { initialUrl: '/reels?pass=1' });
    expect(await screen.findByText(reelsCopy.sheet.body)).toBeTruthy();
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByText(reelsCopy.sheet.buy));
    expect(getDenariiBalance(db)).toBe(30);
    expect(selectReelPasses(db).all()).toHaveLength(1);
    expect(await screen.findByLabelText(reelsCopy.today.label(0, 42))).toBeTruthy();
  });

  it('says why a pass cannot be bought without the denarii', async () => {
    startArc();
    earn(5);
    renderRouter(APP_DIR, { initialUrl: '/reels?pass=1' });
    expect(await screen.findByText(reelsCopy.sheet.needMore(15))).toBeTruthy();
  });
});
