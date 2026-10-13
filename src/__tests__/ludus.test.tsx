/** Free training (the 'ludus' kind): the user's own plan from onboarding, no streak, no fall. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { campaignCopy, onboardingCopy, ordersCopy, progressCopy, todayCopy } from '@/copy';
import { createArc, db, getActiveArc, selectArcOrders, toOrderTargets } from '@/db';
import { DEFAULT_ORDER_TARGETS, type OrderTargets } from '@/features/orders';
import { addDays, toDayKey } from '@/lib/dates';
import { APP_DIR, holdDay, markAwake, resetAppState } from '@/testing/routeKit';

beforeEach(resetAppState);

/** Free training that began some days ago, with these Vinco orders (all four by default). */
function startLudus(daysAgo: number, targets: OrderTargets = DEFAULT_ORDER_TARGETS) {
  createArc(db, {
    kind: 'ludus',
    lengthDays: 0,
    startDay: addDays(toDayKey(new Date()), -daysAgo),
    wakeTime: '06:30',
    targets,
    oathPath: null,
  });
}

const press = (label: string | RegExp) => {
  act(() => jest.advanceTimersByTime(600)); // past the button double-tap guard
  fireEvent.press(screen.getByLabelText(label));
};

describe('Free training', () => {
  it('starts with no orders at all, then opens Today on the dawn card', async () => {
    renderRouter(APP_DIR, { initialUrl: '/onboarding' });
    fireEvent.press(await screen.findByLabelText(new RegExp(`^${onboardingCopy.rubicon.cross}`)));
    await screen.findByText(onboardingCopy.plan.title);
    expect(screen.getByText(onboardingCopy.plan.noneYet)).toBeTruthy();
    press(onboardingCopy.plan.continue(0));
    await screen.findByText(onboardingCopy.tone.title);
    press(onboardingCopy.continue);
    await screen.findByText(onboardingCopy.oath.title);
    press(onboardingCopy.oath.skip);
    expect(await screen.findByText(onboardingCopy.selfie.bodyLudus)).toBeTruthy();
    press(onboardingCopy.selfie.skip);

    expect(await screen.findByText(todayCopy.ludusEyebrow('I'))).toBeTruthy();
    const arc = getActiveArc(db)!;
    expect(arc.kind).toBe('ludus');
    expect(toOrderTargets(selectArcOrders(db, arc.id).all(), arc.kind)).toEqual({});
    // The dawn card still logs sleep; no sick-day Truce, as there is no campaign to protect.
    expect(screen.getByText(todayCopy.dawn.action)).toBeTruthy();
    expect(screen.queryByLabelText(todayCopy.sickDay.dawnAction)).toBeNull();
  });

  it('suggests water when there are no orders, and adds it', async () => {
    startLudus(0, {});
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(todayCopy.noOrders.title)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(new RegExp(`^${todayCopy.noOrders.waterName},`)));
    expect(await screen.findByLabelText(new RegExp(`^${todayCopy.orders.water.name}, `))).toBeTruthy();
    expect(screen.queryByText(todayCopy.noOrders.title)).toBeNull();
  });

  it("removes one of Vinco's orders from the plan, and offers it back", async () => {
    startLudus(0, { water: DEFAULT_ORDER_TARGETS.water, workout: DEFAULT_ORDER_TARGETS.workout });
    renderRouter(APP_DIR, { initialUrl: '/plan' });
    expect(await screen.findByText(ordersCopy.screen.introFree)).toBeTruthy();
    const removes = screen.getAllByLabelText(ordersCopy.screen.remove);
    expect(removes).toHaveLength(2);
    fireEvent.press(removes[0]!);
    press(ordersCopy.removeSheet.confirm);
    expect(
      await screen.findByLabelText(ordersCopy.screen.addSuggestion(ordersCopy.vincoNames.water)),
    ).toBeTruthy();
    const arc = getActiveArc(db)!;
    expect(Object.keys(toOrderTargets(selectArcOrders(db, arc.id).all(), arc.kind))).toEqual(['workout']);
  });

  it('keeps a run going with a nudge, and a missed day is just a day off', async () => {
    startLudus(3);
    const today = toDayKey(new Date());
    holdDay(addDays(today, -3));
    holdDay(addDays(today, -2));
    // Yesterday: nothing done.
    markAwake();
    const app = renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(todayCopy.run.start)).toBeTruthy();
    act(() => jest.advanceTimersByTime(600));
    expect(app.getPathname()).toBe('/veni');
    expect(screen.queryByText(campaignCopy.lost.title)).toBeNull();
    expect(screen.queryByText(todayCopy.chips.campaign(0))).toBeNull();
  });

  it('shows the run so far and how to keep it', async () => {
    startLudus(2);
    const today = toDayKey(new Date());
    holdDay(addDays(today, -2));
    holdDay(addDays(today, -1));
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(todayCopy.run.chip(2))).toBeTruthy();
    expect(screen.getByText(todayCopy.run.nudge(2))).toBeTruthy();
  });

  it('shows days trained on Vidi, with no days to go', async () => {
    startLudus(2);
    holdDay(addDays(toDayKey(new Date()), -1));
    renderRouter(APP_DIR, { initialUrl: '/vidi' });
    expect(await screen.findByText(progressCopy.stats.daysTrained)).toBeTruthy();
    expect(screen.queryByText(progressCopy.stats.daysToGo)).toBeNull();
  });
});
