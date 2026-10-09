import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Marcellus_400Regular } from '@expo-google-fonts/marcellus/400Regular';

import { basalt } from '../palettes/basalt';
import { marble } from '../palettes/marble';
import type { ThemeDefinition } from '../types';

/**
 * The default Vinco theme: Roman in spirit, modern in use.
 * Dark (Basalt) is the default scheme; Marble is the light scheme.
 * Sounds are rendered by scripts/generate-sounds.mjs from the prototype's recipes.
 */
export const vincoTheme: ThemeDefinition = {
  id: 'vinco',
  name: 'Vinco',
  schemes: {
    dark: basalt,
    light: marble,
  },
  fonts: {
    families: {
      display: 'Marcellus_400Regular',
      body: 'Figtree_400Regular',
      bodyMedium: 'Figtree_500Medium',
      bodySemiBold: 'Figtree_600SemiBold',
      bodyBold: 'Figtree_700Bold',
    },
    assets: {
      Marcellus_400Regular,
      Figtree_400Regular,
      Figtree_500Medium,
      Figtree_600SemiBold,
      Figtree_700Bold,
    },
  },
  feedback: {
    // The files carry their own levels (scripts/generate-sounds.mjs); play them as made.
    volume: 1,
    sounds: {
      tap: require('@/assets/sounds/vinco/tap.wav'),
      select: require('@/assets/sounds/vinco/select.wav'),
      toggle: require('@/assets/sounds/vinco/toggle.wav'),
      stepUp: require('@/assets/sounds/vinco/stepUp.wav'),
      stepDown: require('@/assets/sounds/vinco/stepDown.wav'),
      win: require('@/assets/sounds/vinco/win.wav'),
      stamp: require('@/assets/sounds/vinco/stamp.wav'),
      cross: require('@/assets/sounds/vinco/cross.wav'),
      chime: require('@/assets/sounds/vinco/chime.wav'),
      confirm: require('@/assets/sounds/vinco/confirm.wav'),
      recordStart: require('@/assets/sounds/vinco/recordStart.wav'),
      recordStop: require('@/assets/sounds/vinco/recordStop.wav'),
      shutter: require('@/assets/sounds/vinco/shutter.wav'),
      seal: require('@/assets/sounds/vinco/seal.wav'),
      rise: require('@/assets/sounds/vinco/rise.wav'),
      truce: require('@/assets/sounds/vinco/truce.wav'),
      denied: require('@/assets/sounds/vinco/denied.wav'),
      whoosh: require('@/assets/sounds/vinco/whoosh.wav'),
    },
    haptics: {
      tap: 'light',
      select: 'selection',
      toggle: 'selection',
      stepUp: 'selection',
      stepDown: 'selection',
      win: 'success',
      stamp: 'heavy',
      cross: 'heavy',
      chime: 'none',
      confirm: 'success',
      recordStart: 'medium',
      recordStop: 'success',
      shutter: 'medium',
      seal: 'heavy',
      rise: 'success',
      truce: 'medium',
      denied: 'warning',
      whoosh: 'selection',
    },
  },
};
