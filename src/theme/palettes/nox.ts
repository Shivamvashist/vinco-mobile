import type { ColorScheme } from '../types';

/**
 * Nox (night): true black for OLED screens, with Basalt's laurel gold. Surfaces lift only a
 * little off black, so the screen stays dark at night and saves battery.
 */
export const nox: ColorScheme = {
  statusBarStyle: 'light',
  colors: {
    background: '#000000',
    backgroundDeep: '#000000',
    surface: '#100F0E',
    surfaceSunk: '#090908',
    surfaceRaised: '#181715',

    border: '#2C2A26',
    borderStrong: '#4C4740',

    text: '#EDE6D9',
    textMuted: '#A39A8B',
    textFaint: '#58524A',

    accent: '#D6B05A',
    accentPressed: '#E8C97E',
    accentSoft: 'rgba(214,176,90,0.12)',
    accentFill: 'rgba(214,176,90,0.25)',
    accentTint: 'rgba(214,176,90,0.08)',
    accentBorder: 'rgba(214,176,90,0.45)',
    onAccent: '#0A0908',

    danger: '#DC7484',
    dangerSoft: 'rgba(220,116,132,0.16)',
    dangerBorder: 'rgba(220,116,132,0.5)',

    seal: '#8E2B3A',
    onSeal: '#F2D9DD',

    currency: '#C9C6BF',
    rest: '#4A5A6E',
    info: '#8FA7C2',
    success: '#3F6B32',

    scrim: 'rgba(0,0,0,0.7)',
    overlay: 'rgba(0,0,0,0.86)',

    inverse: '#EDE6D9',
    onInverse: '#000000',
  },
};
