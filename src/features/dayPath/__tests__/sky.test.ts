import { minutesLeftInDay, skyBodyAt } from '../sky';

const at = (hours: number, minutes = 0, seconds = 0) => new Date(2026, 10, 1, hours, minutes, seconds);

describe('skyBodyAt', () => {
  it('shows the sun from 06:00 until 19:00, the moon otherwise', () => {
    expect(skyBodyAt(at(5, 59))).toBe('moon');
    expect(skyBodyAt(at(6))).toBe('sun');
    expect(skyBodyAt(at(18, 59))).toBe('sun');
    expect(skyBodyAt(at(19))).toBe('moon');
    expect(skyBodyAt(at(0))).toBe('moon');
  });

  it('reads an unreadable date as day', () => {
    expect(skyBodyAt(new Date(Number.NaN))).toBe('sun');
  });
});

describe('minutesLeftInDay', () => {
  it('counts whole minutes to midnight', () => {
    expect(minutesLeftInDay(at(0))).toBe(1440);
    expect(minutesLeftInDay(at(12))).toBe(720);
    expect(minutesLeftInDay(at(23, 59))).toBe(1);
    // A part minute left still counts as one.
    expect(minutesLeftInDay(at(23, 59, 30))).toBe(1);
  });

  it('is never negative or unreadable', () => {
    expect(minutesLeftInDay(new Date(Number.NaN))).toBe(0);
  });
});
