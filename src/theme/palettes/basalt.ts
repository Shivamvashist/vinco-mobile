import type { ColorScheme } from '../types';

/**
 * Basalt: the default dark scheme of the Vinco theme.
 * Values come straight from the UI prototype. Brand names in comments.
 */
export const basalt: ColorScheme = {
  statusBarStyle: 'light',
  colors: {
    background: '#1D1A17', // basalt
    backgroundDeep: '#0F0D0B',
    surface: '#26221E',
    surfaceSunk: '#211E1A',
    surfaceRaised: '#2E2924',

    border: '#3B352E',
    borderStrong: '#5A5249',

    text: '#ECE5D8', // marble
    textMuted: '#A99F90',
    textFaint: '#5E574E',

    accent: '#D2AC55', // laurel gold
    accentPressed: '#E4C477',
    accentSoft: 'rgba(210,172,85,0.12)',
    accentFill: 'rgba(210,172,85,0.25)',
    accentTint: 'rgba(210,172,85,0.08)',
    accentBorder: 'rgba(210,172,85,0.45)',
    onAccent: '#1D1A17',

    danger: '#D0697D', // porphyry
    dangerSoft: 'rgba(208,105,125,0.16)',
    dangerBorder: 'rgba(208,105,125,0.5)',

    seal: '#8E2B3A', // wax seal
    onSeal: '#F2D9DD',

    currency: '#C9C6BF', // denarii silver
    rest: '#4A5A6E', // truce
    info: '#8FA7C2', // sleep
    success: '#3F6B32',

    scrim: 'rgba(10,9,8,0.6)',
    overlay: 'rgba(15,13,11,0.82)',

    inverse: '#ECE5D8',
    onInverse: '#1D1A17',
  },
};
