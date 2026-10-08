import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

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

  return (
    <ThemeProvider>
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
