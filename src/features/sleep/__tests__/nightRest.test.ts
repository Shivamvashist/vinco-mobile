import { getUsableBedtime, toNightRest } from '..';

const at = (day: number, hours: number, minutes = 0) => new Date(2026, 10, day, hours, minutes);

describe('toNightRest', () => {
  it('turns the native reply into dates', () => {
    const rest = toNightRest({ sleptAt: at(1, 23).getTime(), wokeAt: at(2, 7).getTime() });
    expect(rest).toEqual({ sleptAt: at(1, 23), wokeAt: at(2, 7) });
  });

  it('drops anything missing or broken', () => {
    expect(toNightRest(null)).toBeNull();
    expect(toNightRest({ sleptAt: 'late', wokeAt: 1 })).toBeNull();
    expect(toNightRest({ sleptAt: Number.NaN, wokeAt: 1 })).toBeNull();
    expect(toNightRest({ sleptAt: at(2, 7).getTime(), wokeAt: at(1, 23).getTime() })).toBeNull();
  });
});

describe('getUsableBedtime', () => {
  const rest = { sleptAt: at(1, 23, 10), wokeAt: at(2, 6, 40) };

  it('uses last night for a wake-up this morning, even a late one', () => {
    expect(getUsableBedtime(rest, at(2, 6, 45))).toEqual(at(1, 23, 10));
    expect(getUsableBedtime(rest, at(2, 13))).toEqual(at(1, 23, 10));
  });

  it('never uses an old night, one that has not begun, or a nap-length one', () => {
    expect(getUsableBedtime(rest, at(3, 7))).toBeNull();
    expect(getUsableBedtime(rest, at(1, 22))).toBeNull();
    expect(getUsableBedtime(rest, at(1, 23, 30))).toBeNull();
  });

  it('has nothing to give without an estimate', () => {
    expect(getUsableBedtime(null, at(2, 7))).toBeNull();
  });
});
