import type { ColorScheme } from '../types';

/**
 * Alba (first light): the sky just before sunrise. A pearl ground with a breath of rose, plum-black
 * text and a sunrise vermilion for wins, so the hero's glow reads as dawn light on the stone
 * rather than a stain. Danger leans to a deep porphyry rose so it never reads as the accent.
 */
export const alba: ColorScheme = {
  statusBarStyle: 'dark',
  colors: {
    background: '#F4EEEA',
    backgroundDeep: '#E9E0DA',
    surface: '#FDFAF7',
    surfaceSunk: '#EEE5DF',
    surfaceRaised: '#FFFFFF',

    border: '#D9CCC4',
    borderStrong: '#B19F94',

    text: '#221A1D',
    textMuted: '#5D4E53',
    textFaint: '#9A8B8F',

    accent: '#9E3B22',
    accentPressed: '#84301B',
    accentSoft: 'rgba(158,59,34,0.12)',
    accentFill: 'rgba(158,59,34,0.22)',
    accentTint: 'rgba(158,59,34,0.08)',
    accentBorder: 'rgba(158,59,34,0.45)',
    onAccent: '#FDFAF7',

    danger: '#8E1F4C',
    dangerSoft: 'rgba(142,31,76,0.12)',
    dangerBorder: 'rgba(142,31,76,0.45)',

    seal: '#8E2B3A',
    onSeal: '#F2D9DD',

    currency: '#5E585A',
    rest: '#4A5A6E',
    info: '#3D5D84',
    success: '#3F6B32',

    scrim: 'rgba(34,26,29,0.45)',
    overlay: 'rgba(244,238,234,0.92)',

    inverse: '#221A1D',
    onInverse: '#F4EEEA',
  },
};
