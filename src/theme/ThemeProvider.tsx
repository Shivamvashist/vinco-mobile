import * as SystemUI from 'expo-system-ui';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { playHaptic } from './feedback/playHaptic';
import { configureUiAudio, createSoundBank, type SoundBank } from './feedback/soundBank';
import { buildTheme, resolveSchemeName } from './resolveTheme';
import { DEFAULT_THEME_PREFERENCES, getThemeDefinition, THEMES } from './themes/registry';
import type { ColorMode, FeedbackCue, SchemeName, Theme, ThemeDefinition, ThemePreferences } from './types';

type ThemeControls = {
  preferences: ThemePreferences;
  availableThemes: readonly Pick<ThemeDefinition, 'id' | 'name'>[];
  setThemeId: (themeId: string) => void;
  setColorMode: (colorMode: ColorMode) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
};

type PlayFeedback = (cue: FeedbackCue) => void;

const ThemeContext = createContext<Theme | null>(null);
const ThemeControlsContext = createContext<ThemeControls | null>(null);
const FeedbackContext = createContext<PlayFeedback | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  /** Saved preferences, once storage exists. Missing fields use the defaults. */
  initialPreferences?: Partial<ThemePreferences>;
  /** Called after any preference changes, so it can be saved. */
  onPreferencesChange?: (preferences: ThemePreferences) => void;
};

/** Provides the active theme, the controls to change it, and sound plus haptic feedback. */
export function ThemeProvider({ children, initialPreferences, onPreferencesChange }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preferences, setPreferences] = useState<ThemePreferences>(() => ({
    ...DEFAULT_THEME_PREFERENCES,
    ...initialPreferences,
  }));

  const definition = getThemeDefinition(preferences.themeId);
  const schemeName = resolveSchemeName(preferences.colorMode, systemScheme);
  const theme = useMemo(() => buildTheme(definition, schemeName), [definition, schemeName]);

  // Keeps the native root view (seen behind the keyboard and during transitions) on-theme.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => undefined);
  }, [theme.colors.background]);

  // Report changes after they land, never on first render. Kept out of the state updater,
  // because React may run updaters twice in development.
  const onChangeRef = useRef(onPreferencesChange);
  useEffect(() => {
    onChangeRef.current = onPreferencesChange;
  }, [onPreferencesChange]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChangeRef.current?.(preferences);
  }, [preferences]);

  const updatePreferences = useCallback((patch: Partial<ThemePreferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
  }, []);

  const controls = useMemo<ThemeControls>(
    () => ({
      preferences,
      availableThemes: THEMES.map(({ id, name }) => ({ id, name })),
      setThemeId: (themeId) => updatePreferences({ themeId: getThemeDefinition(themeId).id }),
      setColorMode: (colorMode) => updatePreferences({ colorMode }),
      setSoundEnabled: (soundEnabled) => updatePreferences({ soundEnabled }),
      setHapticsEnabled: (hapticsEnabled) => updatePreferences({ hapticsEnabled }),
    }),
    [preferences, updatePreferences],
  );

  return (
    <ThemeControlsContext value={controls}>
      <ThemeContext value={theme}>
        <FeedbackProvider
          definition={definition}
          soundEnabled={preferences.soundEnabled}
          hapticsEnabled={preferences.hapticsEnabled}
        >
          {children}
        </FeedbackProvider>
      </ThemeContext>
    </ThemeControlsContext>
  );
}

type FeedbackProviderProps = {
  children: ReactNode;
  definition: ThemeDefinition;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

function FeedbackProvider({ children, definition, soundEnabled, hapticsEnabled }: FeedbackProviderProps) {
  const soundBank = useRef<SoundBank | null>(null);

  useEffect(() => {
    void configureUiAudio();
  }, []);

  // One bank per theme. Switching themes releases the old sounds.
  useEffect(() => {
    const bank = createSoundBank(definition.feedback);
    soundBank.current = bank;
    return () => {
      bank.release();
      if (soundBank.current === bank) soundBank.current = null;
    };
  }, [definition]);

  const play = useCallback<PlayFeedback>(
    (cue) => {
      if (soundEnabled) soundBank.current?.play(cue);
      if (hapticsEnabled) playHaptic(definition.feedback.haptics[cue] ?? 'none');
    },
    [definition, soundEnabled, hapticsEnabled],
  );

  return <FeedbackContext value={play}>{children}</FeedbackContext>;
}

type SchemeOverrideProps = {
  scheme: SchemeName;
  children: ReactNode;
};

/**
 * Forces a scheme for one part of the tree, whatever the user picked.
 * Use for immersive screens that must stay dark, like the camera.
 */
export function SchemeOverride({ scheme, children }: SchemeOverrideProps) {
  const parent = useTheme();
  const theme = useMemo(() => buildTheme(getThemeDefinition(parent.id), scheme), [parent.id, scheme]);
  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

/** The active theme: colours, type, spacing, radius, layout, motion. */
export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside <ThemeProvider>.');
  return theme;
}

/** Read and change theme preferences (theme, colour mode, sound, haptics). */
export function useThemeControls(): ThemeControls {
  const controls = use(ThemeControlsContext);
  if (!controls) throw new Error('useThemeControls must be used inside <ThemeProvider>.');
  return controls;
}

/** Returns play(cue): the theme's sound and haptic for that moment, respecting user settings. */
export function useFeedback(): PlayFeedback {
  const play = use(FeedbackContext);
  if (!play) throw new Error('useFeedback must be used inside <ThemeProvider>.');
  return play;
}
