import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { CrashScreen } from '@/components/CrashScreen';
import { RewardFlightLayer } from '@/components/hud/RewardFlightLayer';
import { NoticeHost } from '@/components/notices/NoticeHost';
import { StartupError } from '@/components/StartupError';
import { useDatabaseMigrations } from '@/db';
import { useReelWatch } from '@/hooks/useReelWatch';
import { installCrashRecorder } from '@/lib/crashLog';
import { selectThemePreferences, usePreferencesStore } from '@/stores';
import { getAllFontAssets, ThemeProvider, useTheme } from '@/theme';

// Keep the splash up until fonts and the database are ready, so nothing flashes or loads half-way.
SplashScreen.preventAutoHideAsync().catch(() => undefined);
// Any uncaught error leaves its cause on the phone (lib/crashLog), even if the app closes.
installCrashRecorder();

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

function ThemedApp({ hasStartupError }: ThemedAppProps) {
  return <AppTheme>{hasStartupError ? <StartupError /> : <RootNavigator />}</AppTheme>;
}

/** Feeds the saved preferences into the theme. The store restores synchronously, so there is no flash. */
function AppTheme({ children }: { children: ReactNode }) {
  const preferences = usePreferencesStore(useShallow(selectThemePreferences));
  const updateThemePreferences = usePreferencesStore((state) => state.updateThemePreferences);

  return (
    <ThemeProvider preferences={preferences} onPreferencesChange={updateThemePreferences}>
      {children}
    </ThemeProvider>
  );
}

/**
 * Expo Router shows this instead of the app when a screen throws while drawing (a release build
 * would otherwise close). It sits outside the app's theme, so it brings its own.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <AppTheme>
      <CrashScreen error={error} where="root" retry={() => void retry()} />
    </AppTheme>
  );
}

function RootNavigator() {
  const theme = useTheme();
  // The reel counter's settings and counts, kept in step from every screen (the database is ready here).
  useReelWatch();

  return (
    <>
      <StatusBar style={theme.statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen
          name="alarm"
          options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="campaign-lost" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="day-card" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="timelapse" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen
          name="focus"
          options={{ presentation: 'fullScreenModal', animation: 'fade_from_bottom' }}
        />
        <Stack.Screen
          name="selfie"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
      </Stack>
      {/* Claimed rewards fly over every screen to the HUD counters (components/hud). */}
      <RewardFlightLayer />
      {/* In-app notices, over every screen (components/notices; sheets mount their own). */}
      <NoticeHost />
    </>
  );
}
