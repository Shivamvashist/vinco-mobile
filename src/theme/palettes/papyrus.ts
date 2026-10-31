import type { ColorScheme } from '../types';

/**
 * Papyrus (parchment): warm paper, sepia ink and laurel-leaf green for wins. A softer light
 * palette than Marble for reading in daylight.
 */
export const papyrus: ColorScheme = {
  statusBarStyle: 'dark',
  colors: {
    background: '#F3EAD3',
    backgroundDeep: '#E8DDC2',
    surface: '#FBF6E8',
    surfaceSunk: '#ECE2C9',
    surfaceRaised: '#FFFCF3',

    border: '#D6C7A2',
    borderStrong: '#B3A27C',

    text: '#2A2117',
    textMuted: '#5E4F3A',
    textFaint: '#9C8D73',

    accent: '#3B5C25',
    accentPressed: '#2F4A1D',
    accentSoft: 'rgba(59,92,37,0.12)',
    accentFill: 'rgba(59,92,37,0.22)',
    accentTint: 'rgba(59,92,37,0.08)',
    accentBorder: 'rgba(59,92,37,0.45)',
    onAccent: '#FBF6E8',

    danger: '#9E2539',
    dangerSoft: 'rgba(158,37,57,0.12)',
    dangerBorder: 'rgba(158,37,57,0.45)',

    seal: '#8E2B3A',
    onSeal: '#F2D9DD',

    currency: '#5B564C',
    rest: '#4A5A6E',
    info: '#3F5F80',
    success: '#3F6B32',

    scrim: 'rgba(42,33,23,0.45)',
    overlay: 'rgba(243,234,211,0.92)',

    inverse: '#2A2117',
    onInverse: '#F3EAD3',
  },
};
