/** The Ludus (training ground): chosen in onboarding, no streak, no fall. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { campaignCopy, onboardingCopy, progressCopy, todayCopy } from '@/copy';
import { createArc, db, getActiveArc } from '@/db';
import { DEFAULT_ORDER_TARGETS } from '@/features/orders';
import { addDays, toDayKey } from '@/lib/dates';
import { APP_DIR, holdDay, markAwake, resetAppState } from '@/testing/routeKit';

beforeEach(resetAppState);

/** A Ludus that began some days ago. */
function startLudus(daysAgo: number) {
  createArc(db, {
    kind: 'ludus',
    lengthDays: 0,
    startDay: addDays(toDayKey(new Date()), -daysAgo),
    wakeTime: '06:30',
    targets: DEFAULT_ORDER_TARGETS,
    oathPath: null,
  });
}

describe('Ludus', () => {
  it('is chosen on step I and opens Today as the training ground', async () => {
    renderRouter(APP_DIR, { initialUrl: '/onboarding' });
    const press = (label: string | RegExp) => {
      act(() => jest.advanceTimersByTime(600));
      fireEvent.press(screen.getByLabelText(label));
    };
    fireEvent.press(await screen.findByLabelText(new RegExp(`^${onboardingCopy.rubicon.cross}`)));
    press(new RegExp(`^${onboardingCopy.arc.ludus.name}`));
    expect(screen.getByText(onboardingCopy.arc.ludus.quip)).toBeTruthy();
    press(onboardingCopy.continue);
    await screen.findByText(onboardingCopy.orders.title);
    press(onboardingCopy.orders.accept);
    await screen.findByText(onboardingCopy.tone.title);
    press(onboardingCopy.continue);
    await screen.findByText(onboardingCopy.oath.title);
    press(onboardingCopy.oath.skip);
    expect(await screen.findByText(onboardingCopy.selfie.bodyLudus)).toBeTruthy();
    press(onboardingCopy.selfie.skip);

    expect(await screen.findByText(todayCopy.ludusEyebrow('I'))).toBeTruthy();
    expect(getActiveArc(db)?.kind).toBe('ludus');
    // No sick-day Truce: there is no campaign to protect.
    expect(screen.queryByLabelText(todayCopy.sickDay.dawnAction)).toBeNull();
  });

  it('counts days trained, and a missed day is just a day off', async () => {
    startLudus(3);
    const today = toDayKey(new Date());
    holdDay(addDays(today, -3));
    holdDay(addDays(today, -2));
    // Yesterday: nothing done.
    markAwake();
    const app = renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(todayCopy.chips.trained(2))).toBeTruthy();
    act(() => jest.advanceTimersByTime(600));
    expect(app.getPathname()).toBe('/veni');
    expect(screen.queryByText(campaignCopy.lost.title)).toBeNull();
    expect(screen.queryByText(todayCopy.chips.campaign(0))).toBeNull();
  });

  it('shows days trained on Vidi, with no days to go', async () => {
    startLudus(2);
    holdDay(addDays(toDayKey(new Date()), -1));
    renderRouter(APP_DIR, { initialUrl: '/vidi' });
    expect(await screen.findByText(progressCopy.stats.daysTrained)).toBeTruthy();
    expect(screen.queryByText(progressCopy.stats.daysToGo)).toBeNull();
  });
});
