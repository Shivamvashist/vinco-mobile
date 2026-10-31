import {
  clearRewardFlight,
  getRewardFlight,
  glyphCount,
  landGlyph,
  launchRewardFlight,
  registerCounter,
  reportShown,
  resetRewardFlight,
  setFlightLayerReady,
  shouldCueLanding,
  shownValue,
} from '../rewardFlight';

const FROM = { x: 100, y: 400 };
const TO = { x: 300, y: 40 };

beforeEach(() => {
  jest.useFakeTimers();
  resetRewardFlight();
});

afterEach(() => jest.useRealTimers());

describe('glyphCount', () => {
  it('scales coins and sparks with the amount, one shield per Truce', () => {
    expect(glyphCount('denarii', 3)).toBe(5);
    expect(glyphCount('denarii', 100)).toBe(10);
    expect(glyphCount('gloria', 10)).toBe(4);
    expect(glyphCount('gloria', 500)).toBe(8);
    expect(glyphCount('truces', 1)).toBe(1);
    expect(glyphCount('truces', 0)).toBe(0);
  });
});

describe('launchRewardFlight', () => {
  it('flies nothing without the layer (reduce motion) or without a counter on screen', () => {
    registerCounter('denarii', (done) => done(TO));
    launchRewardFlight({ from: FROM, rewards: { denarii: 5 } });
    expect(getRewardFlight().groups).toHaveLength(0);

    setFlightLayerReady(true);
    launchRewardFlight({ from: FROM, rewards: { gloria: 10 } });
    expect(getRewardFlight().groups).toHaveLength(0);
  });

  it('counts up from the value before the claim as glyphs land, then settles on the total', () => {
    setFlightLayerReady(true);
    registerCounter('denarii', (done) => done(TO));
    reportShown('denarii', 100);
    launchRewardFlight({ from: FROM, rewards: { denarii: 10, truces: 0 } });
    const flying = getRewardFlight();
    expect(flying.groups).toHaveLength(1);
    const group = flying.groups[0]!;
    expect(group.to).toEqual(TO);
    // The live total already reads 110; the counter still shows 100.
    expect(shownValue(flying, 'denarii', 110)).toBe(100);
    landGlyph(group.id);
    expect(shownValue(getRewardFlight(), 'denarii', 110)).toBe(100 + Math.round(10 / group.glyphs));
    for (let index = 1; index < group.glyphs; index += 1) landGlyph(group.id);
    expect(getRewardFlight().groups).toHaveLength(0);
    expect(shownValue(getRewardFlight(), 'denarii', 110)).toBe(110);
  });

  it('drops a flight whose counter cannot be measured, and never holds a counter for long', () => {
    setFlightLayerReady(true);
    const unregister = registerCounter('gloria', (done) => done(null));
    launchRewardFlight({ from: FROM, rewards: { gloria: 20 } });
    expect(getRewardFlight().groups).toHaveLength(0);
    unregister();

    registerCounter('truces', () => undefined);
    launchRewardFlight({ from: FROM, rewards: { truces: 1 } });
    expect(getRewardFlight().groups).toHaveLength(1);
    jest.advanceTimersByTime(4000);
    expect(getRewardFlight().groups).toHaveLength(0);
  });
});

describe('rewards already in the records (a focus claim)', () => {
  it('counts up from the total minus the reward, and a reset clears the sky', () => {
    setFlightLayerReady(true);
    registerCounter('gloria', (done) => done(TO));
    reportShown('gloria', 125);
    launchRewardFlight({ from: FROM, rewards: { gloria: 25 }, isAlreadyCounted: true });
    expect(shownValue(getRewardFlight(), 'gloria', 125)).toBe(100);
    clearRewardFlight();
    expect(getRewardFlight().groups).toHaveLength(0);
    expect(shownValue(getRewardFlight(), 'gloria', 125)).toBe(125);
  });
});

describe('shouldCueLanding', () => {
  it('cues the first, every 4th and the last landing', () => {
    const cued = Array.from({ length: 10 }, (_, index) => index).filter((index) =>
      shouldCueLanding(index, 10, 1000, Number.NEGATIVE_INFINITY),
    );
    expect(cued).toEqual([0, 4, 8, 9]);
  });

  it('never cues closer than 90 ms to the last one', () => {
    expect(shouldCueLanding(0, 5, 1050, 1000)).toBe(false);
    expect(shouldCueLanding(0, 5, 1090, 1000)).toBe(true);
  });
});
