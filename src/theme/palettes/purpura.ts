import type { ColorScheme } from '../types';

/**
 * Purpura (imperial purple): a deep violet ground, the colour only emperors wore, with gold.
 * Danger leans rose so it never reads as part of the purple.
 */
export const purpura: ColorScheme = {
  statusBarStyle: 'light',
  colors: {
    background: '#1A1420',
    backgroundDeep: '#0E0A12',
    surface: '#241C2B',
    surfaceSunk: '#1F1825',
    surfaceRaised: '#2C2334',

    border: '#3D3247',
    borderStrong: '#5E4E6B',

    text: '#EEE6EE',
    textMuted: '#AEA1B3',
    textFaint: '#62566A',

    accent: '#D9B562',
    accentPressed: '#E9CB85',
    accentSoft: 'rgba(217,181,98,0.12)',
    accentFill: 'rgba(217,181,98,0.25)',
    accentTint: 'rgba(217,181,98,0.08)',
    accentBorder: 'rgba(217,181,98,0.45)',
    onAccent: '#1A1420',

    danger: '#E5808F',
    dangerSoft: 'rgba(229,128,143,0.16)',
    dangerBorder: 'rgba(229,128,143,0.5)',

    seal: '#8E2B3A',
    onSeal: '#F2D9DD',

    currency: '#CBC6CF',
    rest: '#5A5A80',
    info: '#A3A8D6',
    success: '#4F7A3F',

    scrim: 'rgba(10,6,14,0.6)',
    overlay: 'rgba(14,10,18,0.84)',

    inverse: '#EEE6EE',
    onInverse: '#1A1420',
  },
};
