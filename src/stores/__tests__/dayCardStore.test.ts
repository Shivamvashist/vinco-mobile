import { act } from '@testing-library/react-native';

import { DEFAULT_DAY_CARD_CHOICE, sanitizeDayCardChoice, useDayCardStore } from '../dayCardStore';

describe('day card store', () => {
  beforeEach(() => useDayCardStore.getState().reset());

  it('restores only valid choices', () => {
    expect(sanitizeDayCardChoice({ designId: 'sol', styleId: 'marble' })).toEqual({
      designId: 'sol',
      styleId: 'marble',
    });
    expect(sanitizeDayCardChoice({ designId: 'poster', styleId: 'plaid' })).toEqual(DEFAULT_DAY_CARD_CHOICE);
    expect(sanitizeDayCardChoice('broken')).toEqual(DEFAULT_DAY_CARD_CHOICE);
    expect(sanitizeDayCardChoice(null)).toEqual(DEFAULT_DAY_CARD_CHOICE);
  });

  it('remembers the design and colour picked', () => {
    act(() => {
      useDayCardStore.getState().setDesign('laurel');
      useDayCardStore.getState().setStyle('porphyry');
    });
    expect(useDayCardStore.getState()).toMatchObject({ designId: 'laurel', styleId: 'porphyry' });
  });
});
