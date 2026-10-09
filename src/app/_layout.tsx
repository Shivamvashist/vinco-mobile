import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { selectThemePreferences, usePreferencesStore } from '@/stores';
import { getAllFontAssets, ThemeProvider, useTheme } from '@/theme';

// Keep the splash up until fonts are ready, so text never flashes in the wrong font.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const FONT_ASSETS = getAllFontAssets();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const isReady = fontsLoaded || fontError != null;

  useEffect(() => {
    if (fontError && __DEV__)
      console.warn('[fonts] Failed to load, falling back to system fonts.', fontError);
  }, [fontError]);

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync().catch(() => undefined);
  }, [isReady]);

  if (!isReady) return null;

  return <ThemedApp />;
}

/** Feeds the saved preferences into the theme. The store restores synchronously, so there is no flash. */
function ThemedApp() {
  const preferences = usePreferencesStore(useShallow(selectThemePreferences));
  const updateThemePreferences = usePreferencesStore((state) => state.updateThemePreferences);

  return (
    <ThemeProvider preferences={preferences} onPreferencesChange={updateThemePreferences}>
      <RootNavigator />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </>
  );
}
