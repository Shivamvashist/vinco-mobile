import type { ColorScheme } from '../types';

/**
 * Marble: the light scheme of the Vinco theme.
 * Based on the prototype's "Marble" day card (marble ground, basalt text, deep gold accent).
 * Accent and danger are darker than in Basalt so they keep readable contrast on a light ground.
 */
export const marble: ColorScheme = {
  statusBarStyle: 'dark',
  colors: {
    background: '#F2ECE1',
    backgroundDeep: '#E6DFD2',
    surface: '#FBF8F2',
    surfaceSunk: '#ECE5D8',
    surfaceRaised: '#FFFFFF',

    border: '#D8CEBD',
    borderStrong: '#B3A794',

    text: '#1D1A17',
    textMuted: '#625849',
    textFaint: '#9A8F80',

    accent: '#7A5C14',
    accentPressed: '#634A0F',
    accentSoft: 'rgba(122,92,20,0.12)',
    accentFill: 'rgba(122,92,20,0.22)',
    accentTint: 'rgba(122,92,20,0.08)',
    accentBorder: 'rgba(122,92,20,0.45)',
    onAccent: '#FBF8F2',

    danger: '#A23C52',
    dangerSoft: 'rgba(162,60,82,0.12)',
    dangerBorder: 'rgba(162,60,82,0.45)',

    seal: '#8E2B3A',
    onSeal: '#F2D9DD',

    currency: '#66625B',
    rest: '#4A5A6E',
    info: '#4C6C8F',
    success: '#3F6B32',

    scrim: 'rgba(29,26,23,0.45)',
    overlay: 'rgba(242,236,225,0.92)',

    inverse: '#1D1A17',
    onInverse: '#ECE5D8',
  },
};
