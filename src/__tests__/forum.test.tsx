/** The Forum: the purse on Today, buying, refusals that say why, ways to earn, history, card styles. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { dayCardCopy, forumCopy, todayCopy } from '@/copy';
import { buyItem, db, getDenariiBalance, getTruceReserve, nowIso } from '@/db';
import { ledger } from '@/db/schema';
import { toDayKey } from '@/lib/dates';
import { APP_DIR, markAwake, resetAppState, startArc } from '@/testing/routeKit';

beforeEach(resetAppState);

/** Earned denarii, as if from sealed days. */
function earn(amount: number) {
  db.insert(ledger).values({ day: '2026-01-01', reason: 'day_conquered', amount, createdAt: nowIso() }).run();
}

const itemLabel = (name: string) => new RegExp(`^${name},`);

describe('Forum', () => {
  it('opens from the purse on Today', async () => {
    startArc();
    earn(120);
    const app = renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(todayCopy.chips.denarii(120)));
    expect(await screen.findByText(forumCopy.balance(120))).toBeTruthy();
    expect(app.getPathname()).toBe('/forum');
  });

  it('buys a Truce into the reserve, then says one a day', async () => {
    startArc();
    earn(120);
    renderRouter(APP_DIR, { initialUrl: '/forum' });
    fireEvent.press(await screen.findByLabelText(itemLabel(forumCopy.items.truce.name)));
    expect(await screen.findByText(forumCopy.sheet.balanceAfter(70))).toBeTruthy();
    fireEvent.press(screen.getByLabelText(forumCopy.sheet.buy(50)));
    expect(await screen.findByText(forumCopy.sheet.bought(forumCopy.items.truce.name))).toBeTruthy();
    // One from the arc's start, one bought.
    expect(getTruceReserve(db)).toBe(2);
    expect(getDenariiBalance(db)).toBe(70);

    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(itemLabel(forumCopy.items.truce.name)));
    expect(await screen.findByLabelText(forumCopy.sheet.dailyLimit)).toBeDisabled();
  });

  it('says how much more is needed when the purse is short', async () => {
    startArc();
    earn(10);
    renderRouter(APP_DIR, { initialUrl: '/forum' });
    fireEvent.press(await screen.findByLabelText(itemLabel(forumCopy.items.venia.name)));
    expect(await screen.findByLabelText(forumCopy.sheet.needMore(30))).toBeDisabled();
  });

  it('lists the ways to earn and the history', async () => {
    startArc();
    earn(10);
    renderRouter(APP_DIR, { initialUrl: '/forum' });
    fireEvent.press(await screen.findByLabelText(forumCopy.segments.earn));
    expect(await screen.findByText(forumCopy.earn.ways.dayConquered)).toBeTruthy();
    expect(screen.getAllByText(forumCopy.earn.soon.aurora).length).toBeGreaterThan(0);
    fireEvent.press(screen.getByLabelText(forumCopy.segments.history));
    expect(await screen.findByText(forumCopy.history.reasons.day_conquered!)).toBeTruthy();
  });

  it('adds a bought card style to the day card', async () => {
    startArc();
    markAwake();
    earn(200);
    buyItem(db, 'cardNox', toDayKey(new Date()));
    renderRouter(APP_DIR, { initialUrl: '/day-card' });
    expect(await screen.findByLabelText(dayCardCopy.styleLabel('Nox'))).toBeTruthy();
    expect(screen.queryByLabelText(dayCardCopy.styleLabel('Aurum'))).toBeNull();
    expect(screen.getByLabelText(dayCardCopy.moreStyles)).toBeTruthy();
  });
});
