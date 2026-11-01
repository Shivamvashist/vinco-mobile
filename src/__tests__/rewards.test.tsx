/** Labours, claimable Decorations, Gloria and the HUD counters (docs/REWARDS.md). */
import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { arcCopy, forumCopy, rewardsCopy } from '@/copy';
import { db, getDenariiBalance, getTruceReserve, selectClaims, updateDayLog } from '@/db';
import { DECORATION_REWARDS, LABOUR_RULES, resolveClaimPay } from '@/features/labours';
import { toDayKey } from '@/lib/dates';
import { APP_DIR, markAwake, resetAppState, startArc, startHeldArc } from '@/testing/routeKit';

beforeEach(resetAppState);

const labours = rewardsCopy.labours;
const describeReward = (reward: { denarii: number; gloria: number; truces?: number }, reserve = 0) =>
  rewardsCopy.rewards.describe(resolveClaimPay(reward, reserve));

describe('Labours', () => {
  it('claims a labour from its board into the purse', async () => {
    startArc();
    markAwake();
    updateDayLog(db, toDayKey(new Date()), { selfiePath: 'file:///selfie.jpg' });
    renderRouter(APP_DIR, { initialUrl: '/labours' });
    const claim = await screen.findByLabelText(
      labours.claimLabel(labours.items.selfie.title, describeReward(LABOUR_RULES.selfie.reward, 1)),
    );
    const before = getDenariiBalance(db);
    fireEvent.press(claim);
    expect(getDenariiBalance(db)).toBe(before + LABOUR_RULES.selfie.reward.denarii);
    expect(selectClaims(db).all()).toHaveLength(1);
    expect(
      await screen.findByLabelText(rewardsCopy.hud.denariiLabel(before + LABOUR_RULES.selfie.reward.denarii)),
    ).toBeTruthy();
  });

  it('lists every labour on its board, grouped, with when it resets', async () => {
    startArc();
    const app = renderRouter(APP_DIR, { initialUrl: '/forum' });
    fireEvent.press(await screen.findByLabelText(forumCopy.segments.earn));
    fireEvent.press(await screen.findByLabelText(labours.forumAction));
    expect(await screen.findByText(labours.items.wakeWeek.title)).toBeTruthy();
    expect(app.getPathname()).toBe('/labours');
    expect(screen.getByText(labours.groups.daily)).toBeTruthy();
    expect(screen.getByText(labours.groups.weekly)).toBeTruthy();
  });
});

describe('Decorations', () => {
  it('claims an earned decoration once', async () => {
    startHeldArc(2);
    renderRouter(APP_DIR, { initialUrl: '/vici' });
    const name = arcCopy.decorations.items.firstSeal.name;
    const reserve = getTruceReserve(db);
    const claim = await screen.findByLabelText(
      rewardsCopy.decorations.claimLabel(name, describeReward(DECORATION_REWARDS.firstSeal, reserve)),
    );
    const before = getDenariiBalance(db);
    fireEvent.press(claim);
    expect(getDenariiBalance(db)).toBe(before + DECORATION_REWARDS.firstSeal.denarii);
    expect(await screen.findAllByText(rewardsCopy.decorations.claimed)).not.toHaveLength(0);
  });
});

describe('Gloria and the HUD', () => {
  it('shows Gloria on Vidi and the three counters on every tab', async () => {
    startHeldArc(2);
    renderRouter(APP_DIR, { initialUrl: '/vidi' });
    expect(await screen.findByText(rewardsCopy.gloria.section)).toBeTruthy();
    // Two held days: four orders each at the minimum, wake-up at its full goal too.
    expect(screen.getByLabelText(rewardsCopy.gloria.totalLabel(90))).toBeTruthy();
    expect(screen.getByLabelText(rewardsCopy.hud.gloriaLabel(90))).toBeTruthy();
    expect(screen.getByLabelText(rewardsCopy.hud.trucesLabel(1))).toBeTruthy();
  });

  it('explains Truces from their counter', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/vici' });
    fireEvent.press(await screen.findByLabelText(rewardsCopy.hud.trucesLabel(1)));
    expect(await screen.findByText(rewardsCopy.hud.truceSheetTitle(1))).toBeTruthy();
  });
});
