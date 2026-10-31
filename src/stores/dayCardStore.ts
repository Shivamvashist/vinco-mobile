import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { type DayCardDesignId, DEFAULT_DAY_CARD_DESIGN, isDayCardDesignId } from '@/features/dayCard';
import { DAY_CARD_STYLES, type DayCardStyle } from '@/theme';

import { createPhoneStorage } from './phoneStorage';

type DayCardStyleId = DayCardStyle['id'];

/**
 * The last day card design and colour style picked, so the next sealed day opens on them.
 * Choices only: whether a Forum design or style is still owned is checked on the screen.
 */
export type DayCardChoice = {
  designId: DayCardDesignId;
  styleId: DayCardStyleId;
};

type DayCardActions = {
  setDesign: (designId: DayCardDesignId) => void;
  setStyle: (styleId: DayCardStyleId) => void;
  reset: () => void;
};

export type DayCardStore = DayCardChoice & DayCardActions;

const FIRST_STYLE_ID: DayCardStyleId = DAY_CARD_STYLES[0]?.id ?? 'basalt';

export const DEFAULT_DAY_CARD_CHOICE: DayCardChoice = {
  designId: DEFAULT_DAY_CARD_DESIGN,
  styleId: FIRST_STYLE_ID,
};

function isStyleId(value: unknown): value is DayCardStyleId {
  return DAY_CARD_STYLES.some((style) => style.id === value);
}

/** Keeps only valid saved values; anything else falls back to the default. */
export function sanitizeDayCardChoice(saved: unknown): DayCardChoice {
  const value = (saved != null && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  return {
    designId: isDayCardDesignId(value.designId) ? value.designId : DEFAULT_DAY_CARD_CHOICE.designId,
    styleId: isStyleId(value.styleId) ? value.styleId : DEFAULT_DAY_CARD_CHOICE.styleId,
  };
}

export const useDayCardStore = create<DayCardStore>()(
  persist(
    (set) => ({
      ...DEFAULT_DAY_CARD_CHOICE,
      setDesign: (designId) =>
        set({ designId: isDayCardDesignId(designId) ? designId : DEFAULT_DAY_CARD_CHOICE.designId }),
      setStyle: (styleId) => set({ styleId: isStyleId(styleId) ? styleId : DEFAULT_DAY_CARD_CHOICE.styleId }),
      reset: () => set(DEFAULT_DAY_CARD_CHOICE),
    }),
    {
      name: 'vinco.dayCard',
      version: 1,
      storage: createPhoneStorage<DayCardChoice>(),
      partialize: ({ designId, styleId }) => ({ designId, styleId }),
      migrate: (saved) => sanitizeDayCardChoice(saved),
      merge: (saved, current) => ({ ...current, ...sanitizeDayCardChoice(saved) }),
    },
  ),
);
