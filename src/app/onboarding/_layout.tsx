import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** Onboarding steps slide in from the right, one after another. */
export default function OnboardingLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
