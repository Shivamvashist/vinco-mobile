import type { ColorScheme } from '../types';

/**
 * Calx (limestone): cool grey-white stone, near-black text and imperial purple for wins. The
 * crispest light palette, for bright rooms and sunlight.
 */
export const calx: ColorScheme = {
  statusBarStyle: 'dark',
  colors: {
    background: '#ECEDEA',
    backgroundDeep: '#E0E2DE',
    surface: '#F8F8F6',
    surfaceSunk: '#E3E5E1',
    surfaceRaised: '#FFFFFF',

    border: '#CBCEC8',
    borderStrong: '#A4A8A0',

    text: '#17191A',
    textMuted: '#50565A',
    textFaint: '#8E9496',

    accent: '#5B2D78',
    accentPressed: '#4A2363',
    accentSoft: 'rgba(91,45,120,0.12)',
    accentFill: 'rgba(91,45,120,0.22)',
    accentTint: 'rgba(91,45,120,0.08)',
    accentBorder: 'rgba(91,45,120,0.45)',
    onAccent: '#F8F8F6',

    danger: '#A2283F',
    dangerSoft: 'rgba(162,40,63,0.12)',
    dangerBorder: 'rgba(162,40,63,0.45)',

    seal: '#8E2B3A',
    onSeal: '#F2D9DD',

    currency: '#56595C',
    rest: '#4A5A6E',
    info: '#3E5F86',
    success: '#3F6B32',

    scrim: 'rgba(23,25,26,0.45)',
    overlay: 'rgba(236,237,234,0.92)',

    inverse: '#17191A',
    onInverse: '#ECEDEA',
  },
};
