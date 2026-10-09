import { contrastRatio } from '../contrast';
import { THEMES } from '../themes/registry';
import type { ColorPalette, FeedbackCue, SchemeName } from '../types';

/** Pairs that must stay readable in every theme and scheme: [foreground, background, minimum ratio]. */
const READABLE_PAIRS: [keyof ColorPalette, keyof ColorPalette, number][] = [
  ['text', 'background', 7],
  ['text', 'surface', 7],
  ['textMuted', 'background', 4.5],
  ['textMuted', 'surface', 4.5],
  ['accent', 'background', 4.5],
  ['accent', 'surface', 4.5],
  ['accent', 'surfaceSunk', 4.5],
  ['textMuted', 'surfaceSunk', 4.5],
  ['textMuted', 'surfaceRaised', 4.5],
  ['text', 'surfaceSunk', 7],
  ['onAccent', 'accent', 4.5],
  ['danger', 'background', 4.5],
  ['onSeal', 'seal', 4.5],
  ['onInverse', 'inverse', 7],
  ['border', 'background', 1.3],
];

const ALL_CUES: FeedbackCue[] = [
  'tap',
  'select',
  'toggle',
  'stepUp',
  'stepDown',
  'win',
  'stamp',
  'cross',
  'chime',
  'confirm',
  'recordStart',
  'recordStop',
  'shutter',
  'seal',
  'rise',
  'truce',
  'denied',
];

const SCHEMES: SchemeName[] = ['dark', 'light'];

describe.each(THEMES.map((theme) => [theme.id, theme] as const))('theme "%s"', (_id, theme) => {
  it('has a unique id', () => {
    expect(THEMES.filter((other) => other.id === theme.id)).toHaveLength(1);
  });

  describe.each(SCHEMES)('%s scheme', (scheme) => {
    const { colors } = theme.schemes[scheme];

    it.each(READABLE_PAIRS)('%s on %s meets %d:1', (foreground, background, minimum) => {
      expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(minimum);
    });
  });

  it('defines a sound entry and a haptic for every cue', () => {
    for (const cue of ALL_CUES) {
      expect(theme.feedback.sounds).toHaveProperty(cue);
      expect(theme.feedback.haptics).toHaveProperty(cue);
    }
  });

  it('keeps volume between 0 and 1', () => {
    expect(theme.feedback.volume).toBeGreaterThanOrEqual(0);
    expect(theme.feedback.volume).toBeLessThanOrEqual(1);
  });

  it('loads a font asset for every font family it uses', () => {
    for (const family of Object.values(theme.fonts.families)) {
      expect(theme.fonts.assets).toHaveProperty(family);
    }
  });
});
