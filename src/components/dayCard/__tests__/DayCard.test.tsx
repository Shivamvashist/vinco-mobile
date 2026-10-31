import { render, screen } from '@testing-library/react-native';

import { dayCardCopy } from '@/copy';
import { DAY_CARD_DESIGN_IDS, type DayCardResult } from '@/features/dayCard';
import { TONES } from '@/features/tone';
import { DAY_CARD_STYLES, DEFAULT_THEME_PREFERENCES, ThemeProvider } from '@/theme';

import { DayCard, type DayCardProps } from '../DayCard';
import { leafPath, rayAngles, spreadAngles, wreath } from '../designs/geometry';

const ROWS = [
  { label: 'Water', value: '2 L', isDone: true },
  { label: 'Wake-up', value: '6:10', isDone: true },
  { label: 'Protein meals', value: '1', isDone: false },
  { label: 'Workout', value: '30 min', isDone: true },
];

const RESULTS: DayCardResult[] = ['held', 'conquered'];

function renderCard(props: Partial<DayCardProps>) {
  return render(
    <ThemeProvider preferences={DEFAULT_THEME_PREFERENCES} onPreferencesChange={() => undefined}>
      <DayCard
        dayNumber={12}
        lengthDays={60}
        rows={ROWS}
        campaign={12}
        rankName="Miles"
        cardStyle={DAY_CARD_STYLES[0]!}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe.each(DAY_CARD_DESIGN_IDS)('day card design "%s"', (design) => {
  it.each(DAY_CARD_STYLES.map((style) => [style.name, style] as const))(
    'renders in %s, held and conquered',
    (_name, cardStyle) => {
      for (const result of RESULTS) {
        const { unmount } = renderCard({ design, cardStyle, result });
        expect(screen.getByLabelText(dayCardCopy.cardLabel('XII', 'LX', 3, 4))).toBeTruthy();
        unmount();
      }
    },
  );

  it('copes with free training, no orders, many orders and long numerals', () => {
    const many = Array.from({ length: 10 }, (_, index) => ({
      label: `Order ${index}`,
      value: '1',
      isDone: index % 2 === 0,
    }));
    const cases: Partial<DayCardProps>[] = [
      { isLudus: true, rows: [], dayNumber: 1, campaign: 0 },
      { rows: many, dayNumber: 88, lengthDays: 90 },
      { dayNumber: 138, isLudus: true, rankName: null },
    ];
    for (const props of cases) {
      const { unmount } = renderCard({ design, ...props });
      expect(screen.toJSON()).toBeTruthy();
      unmount();
    }
  });
});

describe('the words on the new designs', () => {
  it('keeps every Memento line to six words, for every tone and result', () => {
    for (const tone of TONES) {
      for (const result of RESULTS) {
        const lines = dayCardCopy.mementoLines[tone][result];
        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) expect(line.split(/\s+/).length).toBeLessThanOrEqual(6);
      }
    }
  });

  it('slams the stamp on a conquered day and keeps a held day quieter', () => {
    const conquered = renderCard({ design: 'stamp', result: 'conquered' });
    expect(screen.getByText(dayCardCopy.stamp.conquered.word)).toBeTruthy();
    conquered.unmount();
    renderCard({ design: 'stamp', result: 'held' });
    expect(screen.getByText(dayCardCopy.stamp.held.word)).toBeTruthy();
    expect(screen.queryByText(dayCardCopy.stamp.conquered.word)).toBeNull();
  });

  it('writes Memento in the chosen tone', () => {
    renderCard({ design: 'memento', result: 'conquered', tone: 'roast', dayNumber: 1 });
    expect(screen.getByText(dayCardCopy.mementoLines.roast.conquered[0]!)).toBeTruthy();
  });

  it('draws order rows only on the classic design', () => {
    const classic = renderCard({ design: 'classic' });
    expect(screen.getByText('Water')).toBeTruthy();
    classic.unmount();
    renderCard({ design: 'sol' });
    expect(screen.queryByText('Water')).toBeNull();
  });
});

describe('card geometry', () => {
  it('fans rays across the sky and spreads marks evenly', () => {
    expect(rayAngles(0)).toEqual([]);
    expect(rayAngles(1)).toEqual([270]);
    const rays = rayAngles(4);
    expect(rays[0]).toBeGreaterThan(180);
    expect(rays[rays.length - 1]).toBeLessThan(360);
    expect(spreadAngles(3, 90, 10)).toEqual([80, 90, 100]);
  });

  it('draws closed leaves and a wreath of two branches', () => {
    expect(leafPath({ x: 0, y: 0 }, 0, 10, 2)).toMatch(/^M0 0 Q.*Z$/);
    const laurel = wreath(100, 100, 80);
    expect(laurel.stems).toHaveLength(2);
    expect(laurel.leaves.length % 2).toBe(0);
    expect(laurel.leaves.join(' ')).not.toMatch(/NaN/);
  });
});
