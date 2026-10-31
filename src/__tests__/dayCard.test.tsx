/** The day card: designs and colours, remembered between visits, Forum designs once bought. */
import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import { dayCardCopy, forumCopy } from '@/copy';
import { buyItem, db, nowIso } from '@/db';
import { ledger } from '@/db/schema';
import { toDayKey } from '@/lib/dates';
import { useDayCardStore } from '@/stores';
import { APP_DIR, markAwake, resetAppState, startArc } from '@/testing/routeKit';

beforeEach(() => {
  resetAppState();
  useDayCardStore.getState().reset();
});

const designChip = (designId: keyof typeof dayCardCopy.designs) =>
  dayCardCopy.designLabel(dayCardCopy.designs[designId]);

describe('Day card designs', () => {
  it('switches design, keeps the colour, and remembers both', async () => {
    startArc();
    markAwake();
    renderRouter(APP_DIR, { initialUrl: '/day-card' });
    expect(await screen.findByLabelText(designChip('classic'))).toBeChecked();
    expect(screen.getByText(dayCardCopy.rows.water)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(designChip('sol')));
    fireEvent.press(screen.getByLabelText(dayCardCopy.styleLabel('Marble')));
    expect(screen.getByLabelText(designChip('sol'))).toBeChecked();
    expect(screen.getByLabelText(dayCardCopy.styleLabel('Marble'))).toBeChecked();
    // Rows of orders are the classic design's; the others draw them as marks.
    expect(screen.queryByText(dayCardCopy.rows.water)).toBeNull();
    expect(useDayCardStore.getState()).toMatchObject({ designId: 'sol', styleId: 'marble' });
  });

  it('shows Forum designs only once bought, and falls back if one is no longer owned', async () => {
    startArc();
    markAwake();
    useDayCardStore.getState().setDesign('stamp');
    renderRouter(APP_DIR, { initialUrl: '/day-card' });
    // Saved as Stamp but not owned: the classic card shows instead.
    expect(await screen.findByLabelText(designChip('classic'))).toBeChecked();
    expect(screen.queryByLabelText(designChip('stamp'))).toBeNull();
    expect(screen.getByLabelText(dayCardCopy.moreStyles)).toBeTruthy();
  });

  it('adds a design bought in the Forum to the picker', async () => {
    startArc();
    markAwake();
    db.insert(ledger)
      .values({ day: '2026-01-01', reason: 'day_conquered', amount: 200, createdAt: nowIso() })
      .run();
    buyItem(db, 'designMemento', toDayKey(new Date()));
    renderRouter(APP_DIR, { initialUrl: '/day-card' });
    fireEvent.press(await screen.findByLabelText(designChip('memento')));
    expect(screen.getByLabelText(designChip('memento'))).toBeChecked();
    expect(screen.queryByLabelText(designChip('stamp'))).toBeNull();
  });

  it('lists the designs in the Forum', async () => {
    startArc();
    renderRouter(APP_DIR, { initialUrl: '/forum' });
    expect(await screen.findByLabelText(new RegExp(`^${forumCopy.items.designStamp.name},`))).toBeTruthy();
    expect(screen.getByLabelText(new RegExp(`^${forumCopy.items.designMemento.name},`))).toBeTruthy();
  });
});
