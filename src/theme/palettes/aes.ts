import type { ColorScheme } from '../types';

/**
 * Aes (bronze): the green of old Roman bronze, verdigris on a dark slate. The one dark palette
 * without gold: wins and primary actions are verdigris.
 */
export const aes: ColorScheme = {
  statusBarStyle: 'light',
  colors: {
    background: '#141A19',
    backgroundDeep: '#0B0F0E',
    surface: '#1C2423',
    surfaceSunk: '#18201F',
    surfaceRaised: '#232D2B',

    border: '#33403E',
    borderStrong: '#4F605C',

    text: '#E4ECE8',
    textMuted: '#9DACA7',
    textFaint: '#56635F',

    accent: '#7CC7B0',
    accentPressed: '#9AD8C4',
    accentSoft: 'rgba(124,199,176,0.12)',
    accentFill: 'rgba(124,199,176,0.25)',
    accentTint: 'rgba(124,199,176,0.08)',
    accentBorder: 'rgba(124,199,176,0.45)',
    onAccent: '#0E1413',

    danger: '#E5848A',
    dangerSoft: 'rgba(229,132,138,0.16)',
    dangerBorder: 'rgba(229,132,138,0.5)',

    seal: '#8E2B3A',
    onSeal: '#F2D9DD',

    currency: '#C9C6BF',
    rest: '#4A5A6E',
    info: '#8FB0C8',
    success: '#4F8A4A',

    scrim: 'rgba(5,8,8,0.6)',
    overlay: 'rgba(11,15,14,0.84)',

    inverse: '#E4ECE8',
    onInverse: '#141A19',
  },
};
