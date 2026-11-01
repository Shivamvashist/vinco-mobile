/**
 * The history charts: the full focus log (from "See all" under the focus setup) and the Gloria
 * history (from the Gloria card on Vidi). Week, month and year views, stepping back through time.
 */
import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { focusCopy, periodsCopy, rewardsCopy } from '@/copy';
import { db, settleFocus, startFocus } from '@/db';
import { periodOf, shiftPeriod } from '@/features/periods';
import { addDays, toDayKey } from '@/lib/dates';
import { APP_DIR, resetAppState, startHeldArc } from '@/testing/routeKit';

beforeEach(resetAppState);

const MINUTE = 60_000;
const today = () => toDayKey(new Date());
const HELD_ROW = new RegExp(`, ${focusCopy.log.held}\.$`);

/** A focus held to the end, settled long before the app opens (history, not a result to show). */
function holdFocus(day: string, hoursAgo: number, minutes = 30) {
  const begun = new Date(Date.now() - hoursAgo * 60 * MINUTE);
  startFocus(db, { day, guard: 'imperium', minutes }, begun);
  settleFocus(db, new Date(begun.getTime() + (minutes + 1) * MINUTE));
}

describe('the focus log', () => {
  it('shows the last three under the setup, and the rest by week and month on its own screen', async () => {
    // A week ago, then four today.
    holdFocus(addDays(today(), -7), 7 * 24 + 2);
    for (const hoursAgo of [6, 5, 4, 3]) holdFocus(today(), hoursAgo);

    renderRouter(APP_DIR, { initialUrl: '/focus' });
    expect(await screen.findByText(focusCopy.setup.title)).toBeTruthy();
    expect(screen.getAllByText(focusCopy.log.held)).toHaveLength(3);

    fireEvent.press(screen.getByLabelText(focusCopy.log.seeAllLabel));
    expect(await screen.findByText(focusCopy.history.title)).toBeTruthy();
    const week = periodOf('week', today());
    expect(screen.getByText(periodsCopy.label(week, today()))).toBeTruthy();
    // Session rows (the chart's legend says Held too).
    expect(screen.getAllByLabelText(HELD_ROW)).toHaveLength(4);
    expect(screen.getByLabelText(periodsCopy.next('week'))).toBeDisabled();

    // Back a week: the older focus alone.
    fireEvent.press(screen.getByLabelText(periodsCopy.previous('week')));
    expect(await screen.findByText(periodsCopy.label(shiftPeriod(week, -1), today()))).toBeTruthy();
    expect(screen.getAllByLabelText(HELD_ROW)).toHaveLength(1);
    // Nothing older than the first focus.
    expect(screen.getByLabelText(periodsCopy.previous('week'))).toBeDisabled();

    // Month and year keep the day in view.
    fireEvent.press(screen.getByLabelText(periodsCopy.kinds.month));
    const month = periodOf('month', shiftPeriod(week, -1).end);
    expect(await screen.findByText(periodsCopy.label(month, today()))).toBeTruthy();
    fireEvent.press(screen.getByLabelText(periodsCopy.kinds.year));
    expect(await screen.findByText(periodsCopy.label(periodOf('year', month.start), today()))).toBeTruthy();
  });

  it('says so in the user tone when a period has no focus', async () => {
    renderRouter(APP_DIR, { initialUrl: '/focus-log' });
    expect(await screen.findByText(focusCopy.history.empty.centurion)).toBeTruthy();
    expect(screen.getByLabelText(periodsCopy.previous('week'))).toBeDisabled();
  });
});

describe('the Gloria history', () => {
  it('opens from the card on Vidi and shows a day by source', async () => {
    startHeldArc(2);
    renderRouter(APP_DIR, { initialUrl: '/vidi' });
    fireEvent.press(await screen.findByLabelText(rewardsCopy.gloria.historyLabel));
    expect(await screen.findByText(rewardsCopy.gloriaHistory.title)).toBeTruthy();
    // The label sits in the navigator and under the period's total.
    expect(screen.getAllByText(periodsCopy.label(periodOf('week', today()), today()))).toHaveLength(2);

    fireEvent.press(screen.getByLabelText(periodsCopy.kinds.day));
    expect(await screen.findAllByText(periodsCopy.label(periodOf('day', today()), today()))).toHaveLength(2);
    fireEvent.press(screen.getByLabelText(periodsCopy.previous('day')));
    // Yesterday was held: four orders at the minimum, wake-up at its full goal.
    expect(
      await screen.findByLabelText(rewardsCopy.gloriaHistory.periodTotalLabel(45, 'Yesterday')),
    ).toBeTruthy();
    expect(screen.getByLabelText(rewardsCopy.gloriaHistory.describeSource('Orders', 45))).toBeTruthy();

    fireEvent.press(screen.getByLabelText(periodsCopy.previous('day')));
    fireEvent.press(screen.getByLabelText(periodsCopy.previous('day')));
    // The journey's first day is as far back as it goes.
    expect(screen.getByLabelText(periodsCopy.previous('day'))).toBeDisabled();

    fireEvent.press(screen.getByLabelText(periodsCopy.kinds.year));
    const year = periodsCopy.label(periodOf('year', addDays(today(), -2)), today());
    expect(await screen.findAllByText(year)).not.toHaveLength(0);
  });
});
