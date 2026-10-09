/**
 * Render smoke tests: boot the real app from src/app and check each screen renders.
 * Catches render errors (bad imports, hooks used outside providers, crashes on first paint)
 * without a phone.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { renderRouter } from 'expo-router/testing-library';

import {
  arcCopy,
  campaignCopy,
  commonCopy,
  dayCardCopy,
  devCopy,
  onboardingCopy,
  ordersCopy,
  progressCopy,
  proofCopy,
  tabAccessibilityLabel,
  tasksCopy,
  todayCopy,
} from '@/copy';
import {
  addCustomOrder,
  addTask,
  callTruce,
  createArc,
  db,
  getActiveArc,
  getDayLog,
  getTruceReserve,
  nowIso,
  saveOrderAmount,
  sealFinishedDays,
  updateDayLog,
  selectArcOrders,
  toOrderTargets,
} from '@/db';
import { FEATURES } from '@/config/features';
import { DEFAULT_ORDER_TARGETS } from '@/features/orders';
import { addDays, toDayKey } from '@/lib/dates';
import { useDevStore, useNoticesStore, useOnboardingStore, usePreferencesStore } from '@/stores';

const APP_DIR = './src/app';

/** An arc that started today, as if onboarding had just finished. */
function startArc() {
  createArc(db, {
    lengthDays: 60,
    startDay: toDayKey(new Date()),
    wakeTime: '06:30',
    targets: DEFAULT_ORDER_TARGETS,
    oathPath: null,
  });
}

/** Wake-up logged for today, as if "I'm up" was reported: the orders are open. */
function markAwake() {
  const today = toDayKey(new Date());
  saveOrderAmount(db, today, 'wake', 1);
  updateDayLog(db, today, { wokeAt: nowIso() });
}

/** Yesterday's bedtime, 8 hours before now: the wake sheet then defaults to 8 hours of sleep. */
function seedBedtime() {
  const yesterday = addDays(toDayKey(new Date()), -1);
  updateDayLog(db, yesterday, { sleptAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() });
}

beforeEach(() => {
  usePreferencesStore.setState({
    tone: 'centurion',
    colorMode: 'dark',
    soundEnabled: true,
    hapticsEnabled: true,
  });
  useOnboardingStore.getState().reset();
  useNoticesStore.setState({ acknowledgedLossDay: null });
  useDevStore.setState({ isDevModeOn: false, dayOffset: 0 });
});

/** An arc that started some days ago, with every day before today held at the minimum. */
function startHeldArc(daysAgo: number, { missYesterday = false } = {}) {
  const today = toDayKey(new Date());
  const start = addDays(today, -daysAgo);
  createArc(db, {
    lengthDays: 60,
    startDay: start,
    wakeTime: '06:30',
    targets: DEFAULT_ORDER_TARGETS,
    oathPath: null,
  });
  const lastHeld = missYesterday ? daysAgo - 1 : daysAgo;
  for (let offset = 0; offset < lastHeld; offset += 1) {
    const day = addDays(start, offset);
    saveOrderAmount(db, day, 'water', 1);
    saveOrderAmount(db, day, 'wake', 1);
    saveOrderAmount(db, day, 'meal', 1);
    saveOrderAmount(db, day, 'workout', 15);
  }
}

describe('app routes', () => {
  beforeEach(startArc);

  it('opens on Veni with the arc day and the progress line', async () => {
    const app = renderRouter(APP_DIR, { initialUrl: '/' });
    expect(await screen.findByText(todayCopy.progressLines[0].centurion)).toBeTruthy();
    expect(screen.getByText(todayCopy.arcEyebrow('I', 'LX'))).toBeTruthy();
    expect(app.getPathname()).toBe('/veni');
  });

  it('switches tabs from the tab bar', async () => {
    const app = renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(tabAccessibilityLabel('vidi')));
    expect(await screen.findByText(progressCopy.title)).toBeTruthy();
    expect(app.getPathname()).toBe('/vidi');

    fireEvent.press(screen.getByLabelText(tabAccessibilityLabel('vici')));
    expect(await screen.findByText(arcCopy.names[60])).toBeTruthy();
    expect(app.getPathname()).toBe('/vici');
  });

  it('marks only the active tab as selected', async () => {
    renderRouter(APP_DIR, { initialUrl: '/vidi' });
    const vidi = await screen.findByLabelText(tabAccessibilityLabel('vidi'));
    expect(vidi).toBeSelected();
    expect(screen.getByLabelText(tabAccessibilityLabel('veni'))).not.toBeSelected();
  });

  it('re-renders tone lines when the tone changes', async () => {
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    await screen.findByText(todayCopy.progressLines[0].centurion);
    act(() => usePreferencesStore.getState().setTone('roast'));
    expect(await screen.findByText(todayCopy.progressLines[0].roast)).toBeTruthy();
  });

  it('renders the theme lab in development, in light mode too', async () => {
    renderRouter(APP_DIR, { initialUrl: '/dev/theme-lab' });
    expect(await screen.findByText('Theme lab · dev only')).toBeTruthy();
    act(() => usePreferencesStore.getState().updateThemePreferences({ colorMode: 'light' }));
    expect(await screen.findByText(/light scheme/)).toBeTruthy();
  });
});

describe('Today', () => {
  beforeEach(() => {
    startArc();
    markAwake();
  });

  const water = todayCopy.orders.water;
  const workout = todayCopy.orders.workout;

  it('keeps adding water past the full goal', async () => {
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    const press = () => fireEvent.press(screen.getByLabelText(new RegExp(`^${water.name},`)));
    await screen.findByLabelText(new RegExp(`^${water.name},`));
    for (let tap = 0; tap < 5; tap += 1) press();
    expect(await screen.findByText(water.line(5, 4, 'full'))).toBeTruthy();
    expect(water.line(5, 4, 'full')).toBe('5 L · conquered, 1 over');
  });

  it('logs an exact workout time past the full goal', async () => {
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(`${workout.name}, ${workout.idleLine(40)}`));
    fireEvent.press(await screen.findByLabelText(new RegExp(`^${todayCopy.workoutSheet.conquerTitle}`)));
    const more = screen.getByLabelText(commonCopy.increase);
    for (let tap = 0; tap < 10; tap += 1) {
      act(() => jest.advanceTimersByTime(200));
      fireEvent.press(more);
    }
    fireEvent.press(screen.getByText(todayCopy.workoutSheet.save));
    act(() => jest.advanceTimersByTime(1000));
    expect(await screen.findByText(workout.doneLine(90, 'full', ''))).toBeTruthy();
  });

  it('opens the wake sheet to correct the times from the wake-up row', async () => {
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(new RegExp(`^${todayCopy.orders.wake.name},`)));
    expect(await screen.findByText(todayCopy.wakeSheet.editTitle)).toBeTruthy();
  });

  it('logs body weight from the proof tile', async () => {
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(
      await screen.findByLabelText(`${proofCopy.weightTile.title}, ${proofCopy.weightTile.notLogged}`),
    );
    const field = await screen.findByLabelText(proofCopy.weightSheet.label);
    fireEvent.changeText(field, '12');
    fireEvent.press(screen.getByLabelText(proofCopy.weightSheet.save));
    expect(await screen.findByText(proofCopy.daily.weightInvalid)).toBeTruthy();
    fireEvent.changeText(field, '72,5');
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(proofCopy.weightSheet.save));
    expect(
      await screen.findByLabelText(`${proofCopy.weightTile.title}, ${proofCopy.weightTile.today('72.5')}`),
    ).toBeTruthy();
    expect(getDayLog(db, toDayKey(new Date()))?.weightKg).toBe(72.5);
  });

  it('adds water on tap and undoes on long press', async () => {
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    const row = await screen.findByLabelText(`${water.name}, ${water.line(0, 4, 'none')}`);
    fireEvent.press(row);
    expect(await screen.findByText(water.line(1, 4, 'min'))).toBeTruthy();
    fireEvent(screen.getByLabelText(`${water.name}, ${water.line(1, 4, 'min')}`), 'longPress');
    expect(await screen.findByText(water.line(0, 4, 'none'))).toBeTruthy();
  });

  it('logs a full workout through the sheet', async () => {
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(`${workout.name}, ${workout.idleLine(40)}`));
    expect(await screen.findByText(todayCopy.workoutSheet.title)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(new RegExp(`^${todayCopy.workoutSheet.conquerTitle}`)));
    fireEvent.press(screen.getByText(todayCopy.workoutSheet.save));
    act(() => jest.advanceTimersByTime(1000));
    expect(await screen.findByText(workout.doneLine(40, 'full', ''))).toBeTruthy();
  });

  it('shows the seal card, not the stamp, for a day held at the minimum', async () => {
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(new RegExp(`^${water.name},`)));
    fireEvent.press(screen.getByLabelText(new RegExp(`^${todayCopy.orders.meal.name},`)));
    fireEvent.press(screen.getByLabelText(new RegExp(`^${workout.name},`)));
    fireEvent.press(await screen.findByLabelText(new RegExp(`^${todayCopy.workoutSheet.holdTitle}`)));
    fireEvent.press(screen.getByText(todayCopy.workoutSheet.save));
    expect(await screen.findByText(todayCopy.sealCard.heldTitle)).toBeTruthy();
    expect(screen.queryByText(todayCopy.stamp.titleWithDay('I'))).toBeNull();
  });

  it('lands the VINCO stamp when every order is conquered', async () => {
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    const press = (name: string) => fireEvent.press(screen.getByLabelText(new RegExp(`^${name},`)));
    await screen.findByLabelText(new RegExp(`^${water.name},`));
    for (let tap = 0; tap < 4; tap += 1) press(water.name);
    press(todayCopy.orders.meal.name);
    press(todayCopy.orders.meal.name);
    press(workout.name);
    fireEvent.press(await screen.findByLabelText(new RegExp(`^${todayCopy.workoutSheet.conquerTitle}`)));
    fireEvent.press(screen.getByText(todayCopy.workoutSheet.save));
    expect(await screen.findByText(todayCopy.stamp.titleWithDay('I'))).toBeTruthy();
    fireEvent.press(screen.getByText(todayCopy.stamp.back));
    expect(await screen.findByText(todayCopy.sealCard.conqueredTitle)).toBeTruthy();
  });

  it('says how to take a step back', async () => {
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(todayCopy.ordersHint)).toBeTruthy();
  });
});

describe('Commentarii', () => {
  it('shows the week of sleep, then water, then weight with its log button', async () => {
    startArc();
    const today = toDayKey(new Date());
    // Today: 7 h 30 m of sleep and 2 L of water.
    updateDayLog(db, today, {
      sleptAt: new Date(Date.now() - 450 * 60 * 1000).toISOString(),
      wokeAt: nowIso(),
    });
    saveOrderAmount(db, today, 'wake', 1);
    saveOrderAmount(db, today, 'water', 2);
    renderRouter(APP_DIR, { initialUrl: '/vidi' });

    fireEvent.press(await screen.findByLabelText(progressCopy.segments.logs));
    expect(await screen.findByText(progressCopy.logs.sleep.title)).toBeTruthy();
    const average = commonCopy.duration(450);
    expect(await screen.findByText(new RegExp(`^Average ${average}\.`))).toBeTruthy();

    fireEvent.press(screen.getByLabelText(progressCopy.logs.kinds.water));
    expect(await screen.findByText(progressCopy.logs.water.title)).toBeTruthy();
    expect(screen.getByText(progressCopy.logs.water.insight('2', 0, 1))).toBeTruthy();

    fireEvent.press(screen.getByLabelText(progressCopy.logs.kinds.weight));
    expect(await screen.findByText(progressCopy.logs.weight.empty)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(progressCopy.logs.weight.logToday));
    fireEvent.changeText(await screen.findByLabelText(proofCopy.weightSheet.label), '72.5');
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(proofCopy.weightSheet.save));
    expect(await screen.findByText(progressCopy.logs.weight.thisWeek('72.5'))).toBeTruthy();
    expect(screen.getByText(progressCopy.logs.weight.firstWeek)).toBeTruthy();
  });

  it('keeps the week arrows inside the arc', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/vidi' });
    fireEvent.press(await screen.findByLabelText(progressCopy.segments.logs));
    const title = await screen.findByText(progressCopy.logs.sleep.title);
    fireEvent.press(screen.getByLabelText(progressCopy.logs.previousWeek));
    fireEvent.press(screen.getByLabelText(progressCopy.logs.nextWeek));
    expect(title).toBeTruthy();
    expect(screen.getByText(progressCopy.logs.sleep.empty)).toBeTruthy();
  });
});

describe('Dawn', () => {
  it('opens on the dawn card, then "I\'m up" logs wake-up and sleep and opens the orders', async () => {
    startArc();
    seedBedtime();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(todayCopy.dawn.waiting)).toBeTruthy();
    // The orders wait, hidden from touch and screen readers.
    expect(screen.queryByLabelText(new RegExp(`^${todayCopy.orders.water.name},`))).toBeNull();

    fireEvent.press(screen.getByLabelText(todayCopy.dawn.action));
    expect(await screen.findByText(todayCopy.wakeSheet.title)).toBeTruthy();
    expect(screen.getByText(todayCopy.wakeSheet.sleepLine(commonCopy.duration(8 * 60)))).toBeTruthy();
    fireEvent.press(screen.getByLabelText(todayCopy.wakeSheet.save));

    expect(await screen.findByLabelText(new RegExp(`^${todayCopy.orders.water.name},`))).toBeTruthy();
    expect(screen.queryByText(todayCopy.dawn.waiting)).toBeNull();
    const log = getDayLog(db, toDayKey(new Date()));
    expect(log?.wokeAt).toBeTruthy();
    expect(log?.sleptAt).toBeTruthy();
    expect(await screen.findByText(new RegExp(`· ${commonCopy.duration(8 * 60)} sleep$`))).toBeTruthy();
  });
});

describe('Sick day', () => {
  it('calls a Truce from the dawn card, keeps the orders open, and can be taken back', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(todayCopy.sickDay.dawnAction));
    expect(await screen.findByText(todayCopy.sickDay.fromReserve(1))).toBeTruthy();
    fireEvent.press(screen.getByLabelText(todayCopy.sickDay.confirm));

    expect(await screen.findByText(todayCopy.sickDay.cardTitle)).toBeTruthy();
    expect(getTruceReserve(db)).toBe(0);
    // No dawn gate on a sick day: anything managed still counts.
    expect(screen.queryByText(todayCopy.dawn.waiting)).toBeNull();
    expect(screen.getByLabelText(new RegExp(`^${todayCopy.orders.water.name},`))).toBeTruthy();

    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(todayCopy.sickDay.better));
    expect(await screen.findByText(todayCopy.dawn.waiting)).toBeTruthy();
    expect(getTruceReserve(db)).toBe(1);
  });
});

describe('Timelapse', () => {
  /** Selfies on the last few days of the arc so far. */
  function seedSelfies(days: number) {
    const today = toDayKey(new Date());
    for (let back = days - 1; back >= 0; back -= 1) {
      updateDayLog(db, addDays(today, -back), { selfiePath: `file:///documents/selfies/${back}.jpg` });
    }
  }

  it('plays this campaign from Today, frame by frame, then offers to play again', async () => {
    startHeldArc(2);
    markAwake();
    seedSelfies(3);
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(
      await screen.findByLabelText(`${proofCopy.reel.arcTile.title}, ${proofCopy.reel.arcTile.detail(3)}`),
    );
    expect(await screen.findByText(proofCopy.reel.counter(1, 3))).toBeTruthy();
    act(() => jest.advanceTimersByTime(400));
    expect(await screen.findByText(proofCopy.reel.counter(2, 3))).toBeTruthy();
    act(() => jest.advanceTimersByTime(400));
    expect(await screen.findByText(proofCopy.reel.counter(3, 3))).toBeTruthy();
    expect(screen.getByLabelText(proofCopy.reel.replay)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(proofCopy.reel.previous));
    expect(await screen.findByText(proofCopy.reel.counter(2, 3))).toBeTruthy();
  });

  it('plays every selfie across arcs from Vici', async () => {
    // An older arc's selfie, before this arc began.
    updateDayLog(db, '2026-01-05', { selfiePath: 'file:///documents/selfies/old.jpg' });
    startHeldArc(1);
    seedSelfies(2);
    renderRouter(APP_DIR, { initialUrl: '/vici' });
    expect(
      await screen.findByText(proofCopy.reel.allCard.detail(3, commonCopy.fullDateLabel('2026-01-05'))),
    ).toBeTruthy();
    fireEvent.press(screen.getByLabelText(proofCopy.reel.allCard.play));
    expect(await screen.findByText(proofCopy.reel.counter(1, 3))).toBeTruthy();
  });

  it('explains when there are too few selfies', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/timelapse' });
    expect(await screen.findByText(proofCopy.reel.tooFew)).toBeTruthy();
  });
});

describe('Onboarding', () => {
  it('starts at the Rubicon on first launch', async () => {
    const app = renderRouter(APP_DIR, { initialUrl: '/' });
    expect(await screen.findByText(onboardingCopy.rubicon.cross)).toBeTruthy();
    expect(app.getPathname()).toBe('/onboarding');
  });

  it('resumes at the last step reached', async () => {
    useOnboardingStore.getState().setLastStep('tone');
    const app = renderRouter(APP_DIR, { initialUrl: '/' });
    expect(await screen.findByText(onboardingCopy.tone.title)).toBeTruthy();
    expect(app.getPathname()).toBe('/onboarding/tone');
  });

  it('skips onboarding when an arc is active', async () => {
    startArc();
    const app = renderRouter(APP_DIR, { initialUrl: '/' });
    await screen.findByText(todayCopy.ordersSection);
    expect(app.getPathname()).toBe('/veni');
  });

  it('goes from the Rubicon to Day I and saves the arc', async () => {
    renderRouter(APP_DIR, { initialUrl: '/onboarding' });
    const press = (label: string | RegExp) => {
      act(() => jest.advanceTimersByTime(600)); // past the button double-tap guard
      fireEvent.press(screen.getByLabelText(label));
    };

    fireEvent.press(await screen.findByLabelText(new RegExp(`^${onboardingCopy.rubicon.cross}`)));
    // Arc: choose 30 days.
    press(new RegExp(`^${onboardingCopy.arc.options[30].name}`));
    press(onboardingCopy.continue);
    // Orders: water up half a litre.
    await screen.findByText(onboardingCopy.orders.title);
    fireEvent(screen.getByLabelText(onboardingCopy.orders.water.adjust), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    press(onboardingCopy.orders.accept);
    // Tone: Roast me.
    await screen.findByText(onboardingCopy.tone.title);
    press(/^Roast me/);
    press(onboardingCopy.continue);
    // Oath: skip.
    await screen.findByText(onboardingCopy.oath.title);
    press(onboardingCopy.oath.skip);
    // Selfie: start without one.
    await screen.findByText(onboardingCopy.selfie.title);
    press(onboardingCopy.selfie.skip);

    expect(await screen.findByText(todayCopy.arcEyebrow('I', 'XXX'))).toBeTruthy();
    expect(usePreferencesStore.getState().tone).toBe('roast');
    const arc = getActiveArc(db);
    expect(arc?.lengthDays).toBe(30);
    expect(toOrderTargets(selectArcOrders(db, arc?.id ?? -1).all()).water.full).toBe(4.5);
    expect(useOnboardingStore.getState().lastStep).toBeNull();
    // Back from Today must not return into onboarding.
    expect(router.canGoBack()).toBe(false);
  });
});

describe('Campaign', () => {
  it('seals past days on open and shows the campaign and rank on Today', async () => {
    const today = toDayKey(new Date());
    const start = addDays(today, -2);
    createArc(db, {
      lengthDays: 60,
      startDay: start,
      wakeTime: '06:30',
      targets: DEFAULT_ORDER_TARGETS,
      oathPath: null,
    });
    for (const day of [start, addDays(start, 1)]) {
      saveOrderAmount(db, day, 'water', 1);
      saveOrderAmount(db, day, 'wake', 1);
      saveOrderAmount(db, day, 'meal', 1);
      saveOrderAmount(db, day, 'workout', 15);
    }

    renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(todayCopy.chips.campaign(2))).toBeTruthy();
    expect(screen.getByText('Tiro')).toBeTruthy();
    expect(screen.getByText(todayCopy.arcEyebrow('III', 'LX'))).toBeTruthy();
  });
});

describe('Vidi', () => {
  it('shows real stats, a labelled calendar and timelapse progress', async () => {
    const today = toDayKey(new Date());
    const start = addDays(today, -2);
    createArc(db, {
      lengthDays: 60,
      startDay: start,
      wakeTime: '06:30',
      targets: DEFAULT_ORDER_TARGETS,
      oathPath: null,
    });
    const log = (day: string, water: number, meal: number, workout: number) => {
      saveOrderAmount(db, day, 'water', water);
      saveOrderAmount(db, day, 'wake', 1);
      saveOrderAmount(db, day, 'meal', meal);
      saveOrderAmount(db, day, 'workout', workout);
    };
    log(start, 4, 2, 40); // conquered
    log(addDays(start, 1), 1, 1, 15); // held

    renderRouter(APP_DIR, { initialUrl: '/vidi' });
    expect(await screen.findByLabelText(`2 ${progressCopy.stats.campaign}`)).toBeTruthy();
    expect(screen.getByLabelText(`1/3 ${progressCopy.stats.fullGoalDays}`)).toBeTruthy();
    expect(screen.getByLabelText(`57 ${progressCopy.stats.daysToGo}`)).toBeTruthy();
    expect(
      screen.getByLabelText(progressCopy.calendar.dayLabel(commonCopy.fullDateLabel(start), 'conquered')),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(progressCopy.calendar.dayLabel(commonCopy.fullDateLabel(today), 'today')),
    ).toBeTruthy();
    expect(screen.getByText(progressCopy.timelapse.count(0, 30))).toBeTruthy();
  });

  it('shows the tone empty state before onboarding', async () => {
    renderRouter(APP_DIR, { initialUrl: '/vidi' });
    expect(await screen.findByText(progressCopy.emptyLine.centurion)).toBeTruthy();
  });
});

describe('Vici', () => {
  it('shows the arc, the journey and the rank earned from sealed days', async () => {
    startHeldArc(2);
    renderRouter(APP_DIR, { initialUrl: '/vici' });
    expect(await screen.findByText(arcCopy.names[60])).toBeTruthy();
    expect(screen.getByLabelText(arcCopy.journeyLabel(3, 60))).toBeTruthy();
    expect(await screen.findByText('Tiro')).toBeTruthy();
    expect(screen.getByText(arcCopy.rank.next('Recruit', 'Miles', 2))).toBeTruthy();
    expect(screen.getByText(arcCopy.rank.denarii(10))).toBeTruthy();
    expect(screen.getByLabelText(`${arcCopy.settings.oath}, ${arcCopy.settings.oathNone}`)).toBeTruthy();
  });

  it('changes tone and appearance from the settings sheets, and toggles sound', async () => {
    startHeldArc(0);
    renderRouter(APP_DIR, { initialUrl: '/vici' });
    fireEvent.press(await screen.findByLabelText(`${arcCopy.settings.tone}, Centurion`));
    fireEvent.press(await screen.findByLabelText(/^Roast me/));
    expect(usePreferencesStore.getState().tone).toBe('roast');

    fireEvent.press(screen.getByLabelText(`${arcCopy.settings.colorMode}, ${arcCopy.colorModes.dark}`));
    fireEvent.press(await screen.findByLabelText(arcCopy.colorModes.light));
    expect(usePreferencesStore.getState().colorMode).toBe('light');

    fireEvent(screen.getByLabelText(arcCopy.settings.sound), 'valueChange', false);
    expect(usePreferencesStore.getState().soundEnabled).toBe(false);
  });

  it('sounds the retreat only after the word is typed, then returns to the Rubicon', async () => {
    startHeldArc(2);
    const app = renderRouter(APP_DIR, { initialUrl: '/vici' });
    fireEvent.press(
      await screen.findByLabelText(`${arcCopy.settings.retreat}, ${arcCopy.settings.retreatValue}`),
    );
    const field = await screen.findByLabelText(arcCopy.retreat.fieldLabel(arcCopy.retreat.word));
    const confirm = () => screen.getByRole('button', { name: arcCopy.retreat.confirm });

    fireEvent.changeText(field, 'retire');
    expect(confirm()).toBeDisabled();
    fireEvent.changeText(field, ' retreat ');
    expect(confirm()).toBeEnabled();
    fireEvent.press(confirm());

    expect(await screen.findByText(onboardingCopy.rubicon.cross)).toBeTruthy();
    expect(app.getPathname()).toBe('/onboarding');
    expect(getActiveArc(db)).toBeUndefined();
    expect(getTruceReserve(db)).toBe(0);
  });

  it('keeps preferences after a retreat', async () => {
    startHeldArc(1);
    act(() => usePreferencesStore.getState().setTone('roast'));
    renderRouter(APP_DIR, { initialUrl: '/vici' });
    fireEvent.press(
      await screen.findByLabelText(`${arcCopy.settings.retreat}, ${arcCopy.settings.retreatValue}`),
    );
    fireEvent.changeText(
      await screen.findByLabelText(arcCopy.retreat.fieldLabel(arcCopy.retreat.word)),
      arcCopy.retreat.word,
    );
    fireEvent.press(screen.getByRole('button', { name: arcCopy.retreat.confirm }));
    await screen.findByText(onboardingCopy.rubicon.cross);
    expect(usePreferencesStore.getState().tone).toBe('roast');
  });
});

describe('Dev mode', () => {
  it('fills today, moves to the next day and seals it', async () => {
    startArc();
    const today = toDayKey(new Date());
    const tomorrow = addDays(today, 1);
    renderRouter(APP_DIR, { initialUrl: '/vici' });
    fireEvent(await screen.findByLabelText(arcCopy.settings.devMode), 'valueChange', true);
    expect(await screen.findByText(devCopy.today(commonCopy.fullDateLabel(today), 0))).toBeTruthy();

    fireEvent.press(screen.getByLabelText(devCopy.conquerToday));
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(devCopy.nextDay));
    expect(await screen.findByText(devCopy.today(commonCopy.fullDateLabel(tomorrow), 1))).toBeTruthy();
    expect(getDayLog(db, today)?.sealedAt).toBeTruthy();
    expect(await screen.findByLabelText(arcCopy.journeyLabel(2, 60))).toBeTruthy();
  });

  it('resets everything back to the Rubicon and the real clock', async () => {
    // The simulated clock is 3 days ahead and the arc began on that day, so nothing was missed.
    createArc(db, {
      lengthDays: 60,
      startDay: addDays(toDayKey(new Date()), 3),
      wakeTime: '06:30',
      targets: DEFAULT_ORDER_TARGETS,
      oathPath: null,
    });
    useDevStore.setState({ isDevModeOn: true, dayOffset: 3 });
    act(() => usePreferencesStore.getState().setTone('roast'));
    const app = renderRouter(APP_DIR, { initialUrl: '/vici' });
    fireEvent.press(await screen.findByLabelText(devCopy.resetAll));
    const buttons = await screen.findAllByRole('button', { name: devCopy.resetAll });
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(buttons[buttons.length - 1]!);

    expect(await screen.findByText(onboardingCopy.rubicon.cross)).toBeTruthy();
    expect(app.getPathname()).toBe('/onboarding');
    expect(getActiveArc(db)).toBeUndefined();
    expect(useDevStore.getState().dayOffset).toBe(0);
    expect(usePreferencesStore.getState().tone).toBe('centurion');
  });
});

describe('Switched-off features', () => {
  it('hides own orders and the to-do list, and their routes go back', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    await screen.findByText(todayCopy.ordersSection);
    expect(screen.queryByLabelText(todayCopy.addOrder)).toBeNull();
    expect(screen.queryByLabelText(new RegExp(`^${todayCopy.todoTile.title},`))).toBeNull();
    act(() => router.push('/tasks'));
    expect(await screen.findByText(todayCopy.ordersSection)).toBeTruthy();
  });
});

describe('Campaign lost', () => {
  it('shows once after a break, then leads to the comeback', async () => {
    // Eight empty days: a break with no campaign before it, so there is nothing a Truce could save.
    const today = toDayKey(new Date());
    createArc(db, {
      lengthDays: 60,
      startDay: addDays(today, -8),
      wakeTime: '06:30',
      targets: DEFAULT_ORDER_TARGETS,
      oathPath: null,
    });

    const first = renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(campaignCopy.lost.title)).toBeTruthy();
    expect(first.getPathname()).toBe('/campaign-lost');
    expect(screen.queryByText(campaignCopy.truce.title)).toBeNull();

    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(campaignCopy.lost.rise));
    expect(await screen.findByText(campaignCopy.risen.title)).toBeTruthy();
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(campaignCopy.risen.toToday));
    expect(await screen.findByText(todayCopy.ordersSection)).toBeTruthy();
    first.unmount();

    const again = renderRouter(APP_DIR, { initialUrl: '/veni' });
    await screen.findByText(todayCopy.ordersSection);
    expect(again.getPathname()).toBe('/veni');
    expect(screen.queryByText(campaignCopy.lost.title)).toBeNull();
  });

  it('shows a run of missed days once, not again each new day', async () => {
    startHeldArc(4, { missYesterday: true });
    const first = renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(campaignCopy.lost.title)).toBeTruthy();
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(campaignCopy.lost.rise));
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(await screen.findByLabelText(campaignCopy.risen.toToday));
    await screen.findByText(todayCopy.ordersSection);
    first.unmount();

    // Another day passes with nothing done: the same break goes on, so no new screen.
    act(() => useDevStore.setState({ dayOffset: 1 }));
    const again = renderRouter(APP_DIR, { initialUrl: '/veni' });
    await screen.findByText(todayCopy.ordersSection);
    act(() => jest.advanceTimersByTime(600));
    expect(again.getPathname()).toBe('/veni');
    expect(screen.queryByText(campaignCopy.lost.title)).toBeNull();
  });

  it('offers a Truce for yesterday, and calling it saves the campaign', async () => {
    // Days I to III held, yesterday (day IV) missed. The arc began with one Truce in reserve.
    startHeldArc(4, { missYesterday: true });
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(campaignCopy.truce.title)).toBeTruthy();
    expect(screen.getByText(campaignCopy.truce.fromReserve(1, 3, 1))).toBeTruthy();

    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(campaignCopy.truce.action(1)));
    expect(await screen.findByText(campaignCopy.truced.title)).toBeTruthy();
    expect(screen.getByText(campaignCopy.truced.detail(3, 0))).toBeTruthy();
    expect(getTruceReserve(db)).toBe(0);
    expect(getDayLog(db, addDays(toDayKey(new Date()), -1))?.truceUsed).toBe(true);

    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(campaignCopy.truced.toToday));
    expect(await screen.findByText(todayCopy.chips.campaign(4))).toBeTruthy();
    expect(screen.queryByText(todayCopy.truceBanner.title)).toBeNull();
  });

  it('keeps the Truce on offer from Today after rising again, until the day ends', async () => {
    startHeldArc(4, { missYesterday: true });
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    await screen.findByText(campaignCopy.truce.title);
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(campaignCopy.lost.rise));
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(await screen.findByLabelText(campaignCopy.risen.toToday));

    expect(await screen.findByText(todayCopy.truceBanner.title)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(todayCopy.truceBanner.action));
    expect(await screen.findByText(campaignCopy.truce.title)).toBeTruthy();
  });

  it('prices the Truce in denarii when the reserve is empty, and refuses when short', async () => {
    // Six days ago the arc began. Day II was missed and the starting Truce covered it;
    // days I, III, IV and V held (20 denarii); yesterday was missed with nothing in reserve.
    const today = toDayKey(new Date());
    const start = addDays(today, -6);
    createArc(db, {
      lengthDays: 60,
      startDay: start,
      wakeTime: '06:30',
      targets: DEFAULT_ORDER_TARGETS,
      oathPath: null,
    });
    for (const offset of [0, 2, 3, 4]) {
      const day = addDays(start, offset);
      saveOrderAmount(db, day, 'water', 1);
      saveOrderAmount(db, day, 'wake', 1);
      saveOrderAmount(db, day, 'meal', 1);
      saveOrderAmount(db, day, 'workout', 15);
    }
    sealFinishedDays(db, { startDay: start, lengthDays: 60 }, DEFAULT_ORDER_TARGETS, addDays(start, 2));
    callTruce(db, [addDays(start, 1)]);

    renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(await screen.findByText(campaignCopy.truce.cannotAfford(50, 20))).toBeTruthy();
    expect(screen.queryByLabelText(new RegExp(`^${campaignCopy.truce.title}`))).toBeNull();
  });
});

describe('Own orders', () => {
  // Built but switched off in the app; these tests cover it switched on.
  beforeEach(() => jest.replaceProperty(FEATURES, 'customOrders', true));
  afterEach(() => jest.restoreAllMocks());

  const READ = { name: 'Read', unit: 'pages', min: 10, full: 30 };
  const custom = todayCopy.customOrder;

  /** Every one of Vinco's four held at the minimum, straight in the database. */
  function holdVincoFour() {
    const today = toDayKey(new Date());
    saveOrderAmount(db, today, 'water', 1);
    saveOrderAmount(db, today, 'meal', 1);
    saveOrderAmount(db, today, 'workout', 15);
  }

  it('adds an order from Today, refusing a full goal below the minimum', async () => {
    startArc();
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(todayCopy.addOrder));
    fireEvent.changeText(await screen.findByLabelText(ordersCopy.add.nameLabel), 'Read');
    fireEvent.changeText(screen.getByLabelText(ordersCopy.add.unitLabel), 'pages');
    fireEvent.changeText(screen.getByLabelText(ordersCopy.add.minLabel), '30');
    fireEvent.changeText(screen.getByLabelText(ordersCopy.add.fullLabel), '10');
    fireEvent.press(screen.getByLabelText(ordersCopy.add.save));
    expect(await screen.findByText(ordersCopy.add.errors.fullBelowMin)).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText(ordersCopy.add.minLabel), '10');
    fireEvent.changeText(screen.getByLabelText(ordersCopy.add.fullLabel), '30');
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(ordersCopy.add.save));
    expect(await screen.findByLabelText(`Read, ${custom.line(0, 10, 30, 'pages', 'none')}`)).toBeTruthy();
    expect(screen.getByLabelText(todayCopy.ringLabel(1, 5))).toBeTruthy();
  });

  it('holds the day only once the own order holds too', async () => {
    startArc();
    markAwake();
    const arc = getActiveArc(db)!;
    addCustomOrder(db, arc.id, READ, toDayKey(new Date()));
    holdVincoFour();
    renderRouter(APP_DIR, { initialUrl: '/veni' });

    const row = await screen.findByLabelText(`Read, ${custom.line(0, 10, 30, 'pages', 'none')}`);
    expect(screen.getByLabelText(todayCopy.ringLabel(4, 5))).toBeTruthy();
    expect(screen.queryByText(todayCopy.sealCard.heldTitle)).toBeNull();

    fireEvent.press(row);
    expect(await screen.findByText(custom.line(10, 10, 30, 'pages', 'min'))).toBeTruthy();
    expect(await screen.findByText(todayCopy.sealCard.heldTitle)).toBeTruthy();

    fireEvent(screen.getByLabelText(`Read, ${custom.line(10, 10, 30, 'pages', 'min')}`), 'longPress');
    expect(await screen.findByText(custom.line(0, 10, 30, 'pages', 'none'))).toBeTruthy();
  });

  it('stands an order down from the orders screen: counts today, gone tomorrow', async () => {
    startArc();
    const arc = getActiveArc(db)!;
    addCustomOrder(db, arc.id, READ, addDays(toDayKey(new Date()), -1));
    renderRouter(APP_DIR, { initialUrl: '/orders' });
    expect(await screen.findByText(ordersCopy.screen.vincoSection)).toBeTruthy();
    fireEvent.press(await screen.findByLabelText(ordersCopy.screen.standDown));
    fireEvent.press(await screen.findByLabelText(ordersCopy.standDownSheet.confirm));
    expect(await screen.findByText(ordersCopy.screen.standsDownTomorrow)).toBeTruthy();
    expect(screen.queryByLabelText(ordersCopy.screen.standDown)).toBeNull();
  });

  it('opens Your orders from Vici', async () => {
    startArc();
    const app = renderRouter(APP_DIR, { initialUrl: '/vici' });
    fireEvent.press(
      await screen.findByLabelText(`${arcCopy.settings.orders}, ${arcCopy.settings.ordersValue}`),
    );
    expect(await screen.findByText(ordersCopy.screen.ownEmpty)).toBeTruthy();
    expect(app.getPathname()).toBe('/orders');
  });
});

describe('To-do', () => {
  beforeEach(() => jest.replaceProperty(FEATURES, 'tasks', true));
  afterEach(() => jest.restoreAllMocks());

  it('adds, ticks and removes tasks, and the Today tile follows', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(await screen.findByLabelText(`${todayCopy.todoTile.title}, ${todayCopy.todoTile.empty}`));
    expect(await screen.findByText(tasksCopy.emptyLine.centurion)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(tasksCopy.add.open));
    const field = await screen.findByLabelText(tasksCopy.add.label);
    fireEvent.press(screen.getByLabelText(tasksCopy.add.save));
    expect(await screen.findByText(tasksCopy.add.errors.titleMissing)).toBeTruthy();

    fireEvent.changeText(field, 'Call the bank');
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(tasksCopy.add.save));
    fireEvent.changeText(field, 'Stretch');
    fireEvent.press(screen.getByLabelText(tasksCopy.add.when.daily));
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(tasksCopy.add.save));
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(tasksCopy.add.done));

    fireEvent.press(await screen.findByLabelText(tasksCopy.checkLabel('Call the bank', false)));
    expect(await screen.findByLabelText(tasksCopy.checkLabel('Call the bank', true))).toBeTruthy();
    expect(screen.getByLabelText(tasksCopy.checkLabel('Stretch', false))).toBeTruthy();

    fireEvent.press(screen.getByLabelText(tasksCopy.remove('Stretch')));
    await waitFor(() => expect(screen.queryByText('Stretch')).toBeNull());

    fireEvent.press(screen.getByLabelText(tasksCopy.back));
    expect(
      await screen.findByLabelText(`${todayCopy.todoTile.title}, ${todayCopy.todoTile.summary(1, 1, 0)}`),
    ).toBeTruthy();
  });

  it('asks to carry over or drop what was left yesterday', async () => {
    startArc();
    const today = toDayKey(new Date());
    const yesterday = addDays(today, -1);
    addTask(db, 'Carry me', 'today', yesterday, addDays(today, 30));
    addTask(db, 'Drop me', 'today', yesterday, addDays(today, 30));
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    expect(
      await screen.findByLabelText(`${todayCopy.todoTile.title}, ${todayCopy.todoTile.summary(0, 0, 2)}`),
    ).toBeTruthy();

    fireEvent.press(screen.getByLabelText(new RegExp(`^${todayCopy.todoTile.title},`)));
    expect(await screen.findByText(tasksCopy.carryOver.title(2))).toBeTruthy();
    const carryButtons = screen.getAllByLabelText(tasksCopy.carryOver.carry);
    fireEvent.press(carryButtons[0]!);
    expect(await screen.findByText(tasksCopy.carriedOver)).toBeTruthy();
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(tasksCopy.carryOver.drop));
    await waitFor(() => expect(screen.queryByText('Drop me')).toBeNull());
    expect(screen.queryByText(tasksCopy.carryOver.title(1))).toBeNull();
  });
});

describe('Daily selfie', () => {
  it('takes the daily selfie from the Today tile and saves the weight', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    fireEvent.press(
      await screen.findByLabelText(`${proofCopy.todayTile.title}, ${proofCopy.todayTile.notTaken}`),
    );
    fireEvent.press(await screen.findByLabelText(proofCopy.camera.takeSelfie));
    // The check: the shot waits for "Looks right" before it is saved.
    expect(await screen.findByText(proofCopy.camera.reviewQuestionFirst)).toBeTruthy();
    expect(getDayLog(db, toDayKey(new Date()))?.selfiePath ?? null).toBeNull();
    fireEvent.press(screen.getByLabelText(proofCopy.camera.looksRight));
    expect(await screen.findByText(proofCopy.daily.saved('I', 1, 60))).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText(proofCopy.daily.weightLabel), '400');
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(proofCopy.daily.done));
    expect(await screen.findByText(proofCopy.daily.weightInvalid)).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText(proofCopy.daily.weightLabel), '72,5');
    act(() => jest.advanceTimersByTime(600));
    fireEvent.press(screen.getByLabelText(proofCopy.daily.done));
    expect(
      await screen.findByLabelText(`${proofCopy.todayTile.title}, ${proofCopy.todayTile.taken}`),
    ).toBeTruthy();
    expect(getDayLog(db, toDayKey(new Date()))?.weightKg).toBe(72.5);
  });
});

describe('Selfie retake', () => {
  it('saves a retake as a new photo, so the old one never shows again', async () => {
    startArc();
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/selfie' });
    fireEvent.press(await screen.findByLabelText(proofCopy.camera.takeSelfie));
    fireEvent.press(await screen.findByLabelText(proofCopy.camera.looksRight));
    await screen.findByText(proofCopy.daily.saved('I', 1, 60));
    const first = getDayLog(db, toDayKey(new Date()))?.selfiePath;

    act(() => jest.advanceTimersByTime(1000));
    fireEvent.press(screen.getByLabelText(proofCopy.camera.retake));
    fireEvent.press(await screen.findByLabelText(proofCopy.camera.takeSelfie));
    fireEvent.press(await screen.findByLabelText(proofCopy.camera.looksRight));
    await waitFor(() => expect(getDayLog(db, toDayKey(new Date()))?.selfiePath).not.toBe(first));
    expect(getDayLog(db, toDayKey(new Date()))?.selfiePath).toMatch(/selfies\/\d{4}-\d{2}-\d{2}-\d+\.jpg$/);
  });
});

describe('Day card', () => {
  async function sealToday() {
    startArc();
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/veni' });
    const press = (pattern: RegExp) => fireEvent.press(screen.getByLabelText(pattern));
    await screen.findByText(todayCopy.ordersSection);
    press(new RegExp(`^${todayCopy.orders.water.name},`));
    press(new RegExp(`^${todayCopy.orders.meal.name},`));
    press(new RegExp(`^${todayCopy.orders.workout.name},`));
    fireEvent.press(await screen.findByLabelText(new RegExp(`^${todayCopy.workoutSheet.holdTitle}`)));
    fireEvent.press(screen.getByText(todayCopy.workoutSheet.save));
    act(() => jest.advanceTimersByTime(600));
    // Held, not conquered: no stamp, the seal card leads to the day card.
    expect(await screen.findByText(todayCopy.sealCard.heldTitle)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(todayCopy.sealCard.action));
    return screen.findByText(dayCardCopy.header);
  }

  it('opens from the seal card with today on the card, and shares it', async () => {
    await sealToday();
    expect(screen.getByLabelText(dayCardCopy.cardLabel('I', 'LX', 4, 4))).toBeTruthy();
    expect(screen.getByText(dayCardCopy.values.litres(1))).toBeTruthy();
    expect(screen.getByText(dayCardCopy.values.minutes(15))).toBeTruthy();

    fireEvent.press(screen.getByLabelText(dayCardCopy.styleLabel('Marble')));
    expect(screen.getByLabelText(dayCardCopy.styleLabel('Marble'))).toBeChecked();

    fireEvent.press(screen.getByLabelText(dayCardCopy.share));
    expect(await screen.findByText(dayCardCopy.shared)).toBeTruthy();
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/day-card.png', expect.anything());
  });

  it('says so when sharing is not available', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await sealToday();
    fireEvent.press(screen.getByLabelText(dayCardCopy.share));
    expect(await screen.findByText(dayCardCopy.shareUnavailable)).toBeTruthy();
  });
});
