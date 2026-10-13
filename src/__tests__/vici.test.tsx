/** Vici: the record, treasury, decorations, past arcs, and moving between campaigns and the Ludus. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { arcCopy, forumCopy, todayCopy } from '@/copy';
import { createArc, db, getActiveArc, selectAllArcs } from '@/db';
import { DEFAULT_ORDER_TARGETS } from '@/features/orders';
import { addDays, toDayKey } from '@/lib/dates';
import { APP_DIR, holdDay, resetAppState, startHeldArc } from '@/testing/routeKit';

beforeEach(resetAppState);

const today = () => toDayKey(new Date());

describe('Vici', () => {
  it('shows the record, treasury and decorations', async () => {
    startHeldArc(2);
    renderRouter(APP_DIR, { initialUrl: '/vici' });
    expect(await screen.findByLabelText(`2 ${arcCopy.stats.campaign}`)).toBeTruthy();
    expect(screen.getByLabelText(`2 ${arcCopy.stats.held}`)).toBeTruthy();
    expect(screen.getByLabelText(arcCopy.treasury.denarii(10))).toBeTruthy();
    expect(screen.getByLabelText(arcCopy.treasury.truces(1))).toBeTruthy();
    expect(
      screen.getByLabelText(`${arcCopy.decorations.items.firstSeal.name}, ${arcCopy.decorations.earned}`),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        `${arcCopy.decorations.items.ironWeek.name}, ${arcCopy.decorations.items.ironWeek.how}`,
      ),
    ).toBeTruthy();
  });

  it('opens the Forum from the treasury', async () => {
    startHeldArc(1);
    const app = renderRouter(APP_DIR, { initialUrl: '/vici' });
    fireEvent.press(await screen.findByLabelText(arcCopy.treasury.visit));
    expect(await screen.findByText(forumCopy.balanceLabel)).toBeTruthy();
    expect(app.getPathname()).toBe('/forum');
  });

  it('leaves a campaign for the Ludus, keeping it in past arcs', async () => {
    startHeldArc(3);
    renderRouter(APP_DIR, { initialUrl: '/vici' });
    fireEvent.press(await screen.findByLabelText(arcCopy.choice.leaveForLudus));
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(await screen.findByLabelText(arcCopy.choice.ludusConfirm));

    expect(await screen.findByText(arcCopy.ludusName)).toBeTruthy();
    expect(getActiveArc(db)?.kind).toBe('ludus');
    expect(screen.getByText(arcCopy.past.section)).toBeTruthy();
    expect(screen.getByText(arcCopy.past.ended)).toBeTruthy();
    expect(screen.getByText(arcCopy.past.done(3, 0))).toBeTruthy();
  });

  it('begins a campaign from the Ludus, from today', async () => {
    createArc(db, {
      kind: 'ludus',
      lengthDays: 0,
      startDay: addDays(today(), -4),
      wakeTime: '05:45',
      targets: DEFAULT_ORDER_TARGETS,
      oathPath: null,
    });
    renderRouter(APP_DIR, { initialUrl: '/vici' });
    expect(await screen.findByText(arcCopy.choice.ludusTitle)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(arcCopy.choice.begin));
    fireEvent.press(await screen.findByLabelText(/^First campaign/));
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(arcCopy.choice.start('XXX')));

    expect(await screen.findByText(arcCopy.names[30])).toBeTruthy();
    expect(getActiveArc(db)).toMatchObject({
      kind: 'campaign',
      lengthDays: 30,
      startDay: today(),
      wakeTime: '05:45',
    });
    expect(selectAllArcs(db).all()).toHaveLength(2);
  });

  it('offers what next once a campaign is complete, on Today too', async () => {
    createArc(db, {
      lengthDays: 30,
      startDay: addDays(today(), -31),
      wakeTime: '06:30',
      targets: DEFAULT_ORDER_TARGETS,
      oathPath: null,
    });
    for (let back = 31; back >= 2; back -= 1) holdDay(addDays(today(), -back));
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(todayCopy.finished.action));
    expect(await screen.findByText(arcCopy.choice.finishedTitle)).toBeTruthy();
    expect(screen.getByLabelText(arcCopy.choice.another)).toBeTruthy();
    expect(screen.getByLabelText(arcCopy.choice.toLudus)).toBeTruthy();
  });
});
