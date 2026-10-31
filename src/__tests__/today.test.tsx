/**
 * Today (Wave 4): the minus, plus and check on order rows, denarii paid the moment the day holds
 * and taken back on undo, the Stipendium card, and the Orders charts in Vidi.
 */
import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { FEATURES } from '@/config/features';
import { progressCopy, todayCopy } from '@/copy';
import { addCustomOrder, db, getActiveArc, getDenariiBalance, saveOrderAmount } from '@/db';
import { toDayKey } from '@/lib/dates';
import { usePreferencesStore } from '@/stores';
import { APP_DIR, markAwake, resetAppState, startArc } from '@/testing/routeKit';

const water = todayCopy.orders.water;
const custom = todayCopy.customOrder;

beforeEach(() => {
  resetAppState();
  jest.replaceProperty(FEATURES, 'customOrders', true);
});
afterEach(() => jest.restoreAllMocks());

/** Meal and workout at the minimum; water and wake-up are left to the test. */
function holdAllButWater() {
  const today = toDayKey(new Date());
  saveOrderAmount(db, today, 'meal', 1);
  saveOrderAmount(db, today, 'workout', 15);
}

describe('Order rows', () => {
  it('adds and takes back with the row actions (the plus and minus)', async () => {
    startArc();
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    const row = await screen.findByLabelText(`${water.name}, ${water.line(0, 4, 'none')}`);
    expect(row.props.accessibilityRole).toBe('adjustable');
    fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    const added = await screen.findByLabelText(`${water.name}, ${water.line(1, 4, 'min')}`);
    fireEvent(added, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(await screen.findByLabelText(`${water.name}, ${water.line(0, 4, 'none')}`)).toBeTruthy();
  });

  it('toggles a done-or-not order with a tap, both ways', async () => {
    startArc();
    markAwake();
    addCustomOrder(
      db,
      getActiveArc(db)!.id,
      { name: 'Stretch', unit: '', min: 1, full: 1 },
      toDayKey(new Date()),
    );
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    const open = await screen.findByLabelText(`Stretch, ${custom.line(0, 1, 1, '', 'none')}`);
    expect(open.props.accessibilityRole).toBe('checkbox');
    fireEvent.press(open);
    const done = await screen.findByLabelText(`Stretch, ${custom.line(1, 1, 1, '', 'full')}`);
    expect(done.props.accessibilityState).toMatchObject({ checked: true });
    fireEvent.press(done);
    expect(await screen.findByLabelText(`Stretch, ${custom.line(0, 1, 1, '', 'none')}`)).toBeTruthy();
  });
});

describe('Denarii when the day holds', () => {
  it('pays the moment the day holds, and takes it back on undo', async () => {
    startArc();
    markAwake();
    holdAllButWater();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(`${water.name}, ${water.line(0, 4, 'none')}`));
    expect(await screen.findByText(todayCopy.denariiToast.paid(5))).toBeTruthy();
    expect(screen.getByLabelText(todayCopy.tiles.purse.label(5, 5))).toBeTruthy();
    expect(getDenariiBalance(db)).toBe(5);

    fireEvent(screen.getByLabelText(`${water.name}, ${water.line(1, 4, 'min')}`), 'longPress');
    expect(await screen.findByText(todayCopy.denariiToast.takenBack(5))).toBeTruthy();
    expect(getDenariiBalance(db)).toBe(0);
  });

  it('shows the run tile, and what the run pays from it', async () => {
    startArc();
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    const next = todayCopy.streak.next(3, 10, false);
    fireEvent.press(await screen.findByLabelText(todayCopy.tiles.run.label(0, next)));
    expect(await screen.findByText(todayCopy.runSheet.title)).toBeTruthy();
    expect(screen.getByText(next)).toBeTruthy();
  });

  it('shows the day on the hero, and opens its summary', async () => {
    startArc();
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    // Wake-up is logged, so one of the four already holds.
    const hero = await screen.findByLabelText(
      todayCopy.hero.accessibleLabel(1, 4, todayCopy.hero.states.open),
    );
    fireEvent.press(hero);
    expect(await screen.findByText(progressCopy.daySheet.ordersTitle)).toBeTruthy();
  });
});

describe('Order charts in Vidi', () => {
  it('shows a chart per order and hides one with its chip, remembered', async () => {
    startArc();
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/vidi' });
    fireEvent.press(await screen.findByLabelText(progressCopy.segments.logs));
    fireEvent.press(await screen.findByLabelText(progressCopy.logs.kinds.orders));
    const mealChip = await screen.findByLabelText(todayCopy.orders.meal.name);
    expect(screen.getAllByText(todayCopy.orders.meal.name).length).toBeGreaterThan(1);
    fireEvent.press(mealChip);
    expect(usePreferencesStore.getState().hiddenOrderCharts).toEqual(['meal']);
    expect(screen.getAllByText(todayCopy.orders.meal.name)).toHaveLength(1);
  });
});
