/** Own to-dos: adding from Today, how often, editing, turning a task into an order, the plan screen. */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { FEATURES } from '@/config/features';
import { ordersCopy, settingsCopy, tasksCopy, todayCopy } from '@/copy';
import { addTask, db, getActiveArc, selectCustomOrdersOn } from '@/db';
import { addDays, toDayKey } from '@/lib/dates';
import { APP_DIR, markAwake, resetAppState, startArc } from '@/testing/routeKit';

beforeEach(resetAppState);
afterEach(() => jest.restoreAllMocks());

const add = tasksCopy.add;
const press = (label: string | RegExp) => {
  act(() => jest.advanceTimersByTime(600)); // past the button double-tap guard
  fireEvent.press(screen.getByLabelText(label));
};

describe('To-do on Today', () => {
  it('adds tasks by how often, ticks them, and edits one by holding it', async () => {
    startArc();
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(tasksCopy.today.empty)).toBeTruthy();

    press(tasksCopy.today.add);
    const field = await screen.findByLabelText(add.label);
    press(add.save);
    expect(await screen.findByText(add.errors.titleMissing)).toBeTruthy();

    fireEvent.changeText(field, 'Call the bank');
    press(add.save);
    fireEvent.changeText(field, 'Stretch');
    press(add.when.daily);
    expect(screen.getByText(add.whenHint.daily)).toBeTruthy();
    press(add.save);
    press(add.done);

    fireEvent.press(await screen.findByLabelText(tasksCopy.checkLabel('Call the bank', false)));
    expect(await screen.findByLabelText(tasksCopy.checkLabel('Call the bank', true))).toBeTruthy();
    expect(screen.getByLabelText(tasksCopy.checkLabel('Stretch', false))).toBeTruthy();

    // Hold to edit: rename and move it to tomorrow, so it leaves today's list.
    fireEvent(screen.getByLabelText(tasksCopy.checkLabel('Stretch', false)), 'longPress');
    const editField = await screen.findByDisplayValue('Stretch');
    fireEvent.changeText(editField, 'Stretch well');
    press(add.when.tomorrow);
    press(tasksCopy.edit.save);
    await waitFor(() => expect(screen.queryByText('Stretch well')).toBeNull());
    expect(screen.getByLabelText(tasksCopy.today.seeAll(2))).toBeTruthy();
  });

  it('moves a ticked task to the bottom, and back up when unticked', async () => {
    startArc();
    markAwake();
    const today = toDayKey(new Date());
    for (const title of ['First', 'Second', 'Third']) addTask(db, title, 'today', today, addDays(today, 30));
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    const order = () =>
      screen.getAllByRole('checkbox').map((row) => String(row.props.accessibilityLabel).split(',')[0]);
    await screen.findByLabelText(tasksCopy.checkLabel('First', false));
    expect(order()).toEqual(['First', 'Second', 'Third']);

    fireEvent.press(screen.getByLabelText(tasksCopy.checkLabel('First', false)));
    await screen.findByLabelText(tasksCopy.checkLabel('First', true));
    expect(order()).toEqual(['Second', 'Third', 'First']);

    fireEvent.press(screen.getByLabelText(tasksCopy.checkLabel('First', true)));
    await screen.findByLabelText(tasksCopy.checkLabel('First', false));
    expect(order()).toEqual(['First', 'Second', 'Third']);
  });

  it('turns a task into an order, which then decides the day', async () => {
    startArc();
    markAwake();
    addTask(db, 'Read', 'today', toDayKey(new Date()), addDays(toDayKey(new Date()), 30));
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent(await screen.findByLabelText(tasksCopy.checkLabel('Read', false)), 'longPress');
    await screen.findByDisplayValue('Read');
    press(add.when.order);
    press(tasksCopy.edit.makeOrder);

    // The order step opens with the name filled in.
    expect(await screen.findByDisplayValue('Read')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText(ordersCopy.add.minLabel), '10');
    fireEvent.changeText(screen.getByLabelText(ordersCopy.add.fullLabel), '30');
    press(ordersCopy.add.save);

    await waitFor(() => expect(screen.queryByLabelText(tasksCopy.checkLabel('Read', false))).toBeNull());
    expect(await screen.findByLabelText(/^Read, /)).toBeTruthy();
    const arc = getActiveArc(db)!;
    expect(selectCustomOrdersOn(db, arc.id, toDayKey(new Date())).all()).toHaveLength(1);
  });

  it('leads leftovers from yesterday to the full list to carry over or drop', async () => {
    startArc();
    markAwake();
    const today = toDayKey(new Date());
    addTask(db, 'Carry me', 'today', addDays(today, -1), addDays(today, 30));
    const app = renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(tasksCopy.today.carryOver(1)));
    expect(await screen.findByText(tasksCopy.carryOver.title(1))).toBeTruthy();
    expect(app.getPathname()).toBe('/plan');
    press(tasksCopy.carryOver.carry);
    expect(await screen.findByText(tasksCopy.carriedOver)).toBeTruthy();
  });
});

describe('Orders and to-dos', () => {
  it('opens from Settings on the orders, and switches to the to-do', async () => {
    startArc();
    const app = renderRouter(APP_DIR, { initialUrl: '/settings' });
    fireEvent.press(
      await screen.findByLabelText(`${settingsCopy.rows.plan}, ${settingsCopy.rows.planValue}`),
    );
    expect(await screen.findByText(ordersCopy.screen.vincoSection)).toBeTruthy();
    expect(app.getPathname()).toBe('/plan');
    press(tasksCopy.plan.segments.todo);
    expect(await screen.findByText(tasksCopy.intro)).toBeTruthy();
  });

  it('keeps old links working', async () => {
    startArc();
    const app = renderRouter(APP_DIR, { initialUrl: '/tasks' });
    expect(await screen.findByText(tasksCopy.intro)).toBeTruthy();
    expect(app.getPathname()).toBe('/plan');
  });
});

describe('Switched off', () => {
  it('hides own orders and the to-do, and the plan goes back to Today', async () => {
    jest.replaceProperty(FEATURES, 'tasks', false);
    jest.replaceProperty(FEATURES, 'customOrders', false);
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    await screen.findByText(todayCopy.ordersSection);
    expect(screen.queryByLabelText(todayCopy.addOrder)).toBeNull();
    expect(screen.queryByText(tasksCopy.today.section)).toBeNull();
    act(() => router.push('/plan'));
    expect(await screen.findByText(todayCopy.ordersSection)).toBeTruthy();
  });
});
