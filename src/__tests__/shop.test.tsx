/** The Shop: the purse counter on Today, buying, refusals that say why, Earn, history, card styles, old links. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { dayCardCopy, shopCopy, rewardsCopy } from '@/copy';
import { buyItem, db, getDenariiBalance, getTruceReserve, nowIso, updateDayLog } from '@/db';
import { ledger } from '@/db/schema';
import { toDayKey } from '@/lib/dates';
import { APP_DIR, markAwake, resetAppState, startArc } from '@/testing/routeKit';

beforeEach(resetAppState);

/** Earned denarii, as if from sealed days. */
function earn(amount: number) {
  db.insert(ledger).values({ day: '2026-01-01', reason: 'day_conquered', amount, createdAt: nowIso() }).run();
}

const itemLabel = (name: string) => new RegExp(`^${name},`);
const purseLabel = (amount: number) => `${shopCopy.balanceLabel}: ${shopCopy.balance(amount)}`;

describe('Shop', () => {
  it('opens from the purse counter on Today', async () => {
    startArc();
    earn(120);
    const app = renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(rewardsCopy.hud.denariiLabel(120)));
    expect(await screen.findByLabelText(purseLabel(120))).toBeTruthy();
    expect(app.getPathname()).toBe('/shop');
  });

  it('buys a Truce into the reserve, then says one a day', async () => {
    startArc();
    earn(120);
    renderRouter(APP_DIR, { initialUrl: '/shop' });
    fireEvent.press(await screen.findByLabelText(itemLabel(shopCopy.items.truce.name)));
    expect(
      await screen.findByLabelText(`${shopCopy.priceLabel(50)}. ${shopCopy.sheet.balanceAfter(70)}`),
    ).toBeTruthy();
    fireEvent.press(screen.getByLabelText(shopCopy.sheet.buy(50)));
    expect(await screen.findByText(shopCopy.sheet.bought(shopCopy.items.truce.name))).toBeTruthy();
    // One from the arc's start, one bought.
    expect(getTruceReserve(db)).toBe(2);
    expect(getDenariiBalance(db)).toBe(70);

    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(itemLabel(shopCopy.items.truce.name)));
    expect(await screen.findByLabelText(shopCopy.sheet.dailyLimit)).toBeDisabled();
  });

  it('says how much more is needed when the purse is short', async () => {
    startArc();
    earn(10);
    renderRouter(APP_DIR, { initialUrl: '/shop' });
    fireEvent.press(await screen.findByLabelText(itemLabel(shopCopy.items.venia.name)));
    expect(await screen.findByLabelText(shopCopy.sheet.needMore(30))).toBeDisabled();
  });

  it('shows the quests and the ways to earn in Earn, and the history', async () => {
    startArc();
    earn(10);
    renderRouter(APP_DIR, { initialUrl: '/shop' });
    fireEvent.press(await screen.findByLabelText(shopCopy.segments.earn));
    expect(await screen.findByText(rewardsCopy.quests.groups.daily)).toBeTruthy();
    expect(screen.getByText(rewardsCopy.quests.items.wakeWeek.title)).toBeTruthy();
    expect(screen.getByText(shopCopy.earn.ways.dayConquered)).toBeTruthy();
    expect(screen.getAllByText(shopCopy.earn.soon.aurora).length).toBeGreaterThan(0);
    fireEvent.press(screen.getByLabelText(shopCopy.segments.history));
    expect(await screen.findByText(shopCopy.history.reasons.day_conquered!)).toBeTruthy();
  });

  it('names a focus retreat paid in denarii in the history', async () => {
    startArc();
    earn(60);
    db.insert(ledger)
      .values({ day: '2026-01-02', reason: 'focus_retreat_7', amount: -50, createdAt: nowIso() })
      .run();
    renderRouter(APP_DIR, { initialUrl: '/shop' });
    fireEvent.press(await screen.findByLabelText(shopCopy.segments.history));
    expect(await screen.findByText(shopCopy.history.focusRetreat)).toBeTruthy();
    expect(screen.queryByText('focus_retreat_7')).toBeNull();
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

  it('sends old links to the Shop: the Forum to the shelf, Labours to Earn', async () => {
    startArc();
    const app = renderRouter(APP_DIR, { initialUrl: '/forum' });
    expect(await screen.findByLabelText(shopCopy.segments.shop)).toBeSelected();
    expect(app.getPathname()).toBe('/shop');
  });

  it('opens on Earn from a link, with the ready quests counted on its tab', async () => {
    startArc();
    markAwake();
    updateDayLog(db, toDayKey(new Date()), { selfiePath: 'file:///selfie.jpg' });
    renderRouter(APP_DIR, { initialUrl: '/labours' });
    expect(await screen.findByLabelText(shopCopy.segments.earn)).toBeSelected();
    expect(screen.getByText(rewardsCopy.quests.readyCount(1))).toBeTruthy();
  });
});
