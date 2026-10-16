/** Orders and to-dos (/plan): editing orders, done-or-not orders, and free training's day card. */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { dayCardCopy, ordersCopy } from '@/copy';
import {
  addCustomOrder,
  createArc,
  db,
  getActiveArc,
  getDayLog,
  saveOrderAmount,
  selectArcOrders,
  selectCustomOrders,
  toOrderTargets,
} from '@/db';
import { DEFAULT_ORDER_TARGETS, type OrderTargets } from '@/features/orders';
import { addDays, toDayKey } from '@/lib/dates';
import { APP_DIR, markAwake, resetAppState, startArc } from '@/testing/routeKit';

beforeEach(resetAppState);

const press = (label: string | RegExp) => {
  act(() => jest.advanceTimersByTime(600)); // past the button double-tap guard
  fireEvent.press(screen.getByLabelText(label));
};

/** Free training that began some days ago, with only these Vinco orders. */
function startFreeTraining(daysAgo: number, targets: OrderTargets) {
  createArc(db, {
    kind: 'ludus',
    lengthDays: 0,
    startDay: addDays(toDayKey(new Date()), -daysAgo),
    wakeTime: '06:30',
    targets,
    oathPath: null,
  });
}

describe('Editing orders', () => {
  it('renames an own order now, and a lower number waits for tomorrow', async () => {
    startArc();
    const arc = getActiveArc(db)!;
    const yesterday = addDays(toDayKey(new Date()), -1);
    addCustomOrder(db, arc.id, { name: 'Hydrate', unit: 'glass', min: 12, full: 12 }, yesterday);
    renderRouter(APP_DIR, { initialUrl: '/plan' });

    fireEvent.press(await screen.findByLabelText(ordersCopy.screen.editLabel('Hydrate')));
    fireEvent.changeText(screen.getByLabelText(ordersCopy.add.nameLabel), 'Drink water');
    fireEvent.changeText(screen.getByLabelText(ordersCopy.add.countLabel), '8');
    expect(screen.getByText(ordersCopy.edit.lowerNote)).toBeTruthy();
    press(ordersCopy.edit.save);

    // Today keeps 12 under the new name; 8 starts tomorrow.
    expect(await screen.findByText(ordersCopy.screen.fromTomorrow('8 glass a day'))).toBeTruthy();
    expect(screen.getByText('Drink water')).toBeTruthy();
    expect(screen.getByText(ordersCopy.screen.daily('12 glass'))).toBeTruthy();
    expect(selectCustomOrders(db, arc.id).all()).toHaveLength(2);
  });

  it("changes a Vinco order's full goal from today", async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/plan' });
    fireEvent.press(await screen.findByLabelText(ordersCopy.screen.editLabel(ordersCopy.vincoNames.water)));
    fireEvent(
      screen.getByLabelText(ordersCopy.vincoEdit.adjust(ordersCopy.vincoNames.water)),
      'accessibilityAction',
      {
        nativeEvent: { actionName: 'increment' },
      },
    );
    press(ordersCopy.vincoEdit.save);
    const arc = getActiveArc(db)!;
    await waitFor(() =>
      expect(toOrderTargets(selectArcOrders(db, arc.id).all()).water?.full).toBe(
        DEFAULT_ORDER_TARGETS.water.full + 0.5,
      ),
    );
    // The minimum is Vinco's and stays.
    expect(toOrderTargets(selectArcOrders(db, arc.id).all()).water?.min).toBe(
      DEFAULT_ORDER_TARGETS.water.min,
    );
  });
});

describe('Done-or-not orders', () => {
  it('adds an order with no unit or number, then ticks it done on Today', async () => {
    startArc();
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/plan' });
    await screen.findByLabelText(ordersCopy.add.title);
    press(ordersCopy.add.title);
    fireEvent.changeText(await screen.findByLabelText(ordersCopy.add.nameLabel), 'Meditate');
    expect(screen.getByText(ordersCopy.add.previewCheck)).toBeTruthy();
    press(ordersCopy.add.save);
    const arc = getActiveArc(db)!;
    await waitFor(() =>
      expect(selectCustomOrders(db, arc.id).all()[0]).toMatchObject({
        name: 'Meditate',
        unit: '',
        min: 1,
        full: 1,
      }),
    );

    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(/^Meditate, Not done yet/));
    expect(await screen.findByLabelText(/^Meditate, Done/)).toBeTruthy();
  });
});

describe('Free training', () => {
  it('seals a day on the orders it has, not all four', async () => {
    startFreeTraining(1, { water: DEFAULT_ORDER_TARGETS.water });
    const yesterday = addDays(toDayKey(new Date()), -1);
    saveOrderAmount(db, yesterday, 'water', DEFAULT_ORDER_TARGETS.water.min);
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    await waitFor(() => expect(getDayLog(db, yesterday)?.result).toBe('held'));
  });

  it("puts only the arc's orders on the day card", async () => {
    startFreeTraining(0, { water: DEFAULT_ORDER_TARGETS.water });
    markAwake();
    saveOrderAmount(db, toDayKey(new Date()), 'water', DEFAULT_ORDER_TARGETS.water.full);
    renderRouter(APP_DIR, { initialUrl: '/day-card' });
    expect(await screen.findByText(dayCardCopy.rows.water)).toBeTruthy();
    expect(screen.queryByText(dayCardCopy.rows.wake)).toBeNull();
    expect(screen.queryByText(dayCardCopy.rows.meal)).toBeNull();
    expect(screen.queryByText(dayCardCopy.rows.workout)).toBeNull();
    expect(screen.getByLabelText(dayCardCopy.cardLabel('I', null, 1, 1))).toBeTruthy();
  });
});

describe('Today', () => {
  it('shows a done-or-not order as done, not "1 of 1"', async () => {
    startArc();
    markAwake();
    const arc = getActiveArc(db)!;
    addCustomOrder(db, arc.id, { name: 'Stretch', unit: '', min: 1, full: 1 }, toDayKey(new Date()));
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByLabelText(/^Stretch, Not done yet/)).toBeTruthy();
    expect(screen.queryByText('0 of 1')).toBeNull();
  });
});
