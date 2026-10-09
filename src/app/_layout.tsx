import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { StartupError } from '@/components/StartupError';
import { useDatabaseMigrations } from '@/db';
import { selectThemePreferences, usePreferencesStore } from '@/stores';
import { getAllFontAssets, ThemeProvider, useTheme } from '@/theme';

// Keep the splash up until fonts and the database are ready, so nothing flashes or loads half-way.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const FONT_ASSETS = getAllFontAssets();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const database = useDatabaseMigrations();
  const areFontsSettled = fontsLoaded || fontError != null;
  const isDatabaseSettled = database.isReady || database.error != null;
  const isReady = areFontsSettled && isDatabaseSettled;

  useEffect(() => {
    if (fontError && __DEV__)
      console.warn('[fonts] Failed to load, falling back to system fonts.', fontError);
  }, [fontError]);

  useEffect(() => {
    if (database.error && __DEV__) console.warn('[db] Migration failed.', database.error);
  }, [database.error]);

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync().catch(() => undefined);
  }, [isReady]);

  if (!isReady) return null;

  return <ThemedApp hasStartupError={database.error != null} />;
}

type ThemedAppProps = {
  /** The database could not be opened: show the recovery screen instead of the app. */
  hasStartupError: boolean;
};

/** Feeds the saved preferences into the theme. The store restores synchronously, so there is no flash. */
function ThemedApp({ hasStartupError }: ThemedAppProps) {
  const preferences = usePreferencesStore(useShallow(selectThemePreferences));
  const updateThemePreferences = usePreferencesStore((state) => state.updateThemePreferences);

  return (
    <ThemeProvider preferences={preferences} onPreferencesChange={updateThemePreferences}>
      {hasStartupError ? <StartupError /> : <RootNavigator />}
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
      >
        <Stack.Screen name="campaign-lost" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="day-card" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="timelapse" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen
          name="selfie"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </>
  );
}
