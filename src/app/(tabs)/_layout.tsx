import { router, Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TabBar } from '@/components/navigation/TabBar';
import { TabSwipe } from '@/components/navigation/TabSwipe';
import { tabTransitionOptions } from '@/components/navigation/tabTransition';
import { tabsCopy } from '@/copy';
import { useAuroraSchedule } from '@/hooks/useAuroraSchedule';
import { useLossNotice } from '@/hooks/useLossNotice';
import { useReminderSchedule } from '@/hooks/useReminderSchedule';
import { useSealFinishedDays } from '@/hooks/useSealFinishedDays';
import { IS_DEV_MODE_AVAILABLE } from '@/stores';
import { useReduceMotion, useTheme } from '@/theme';

/** Dev shortcut: long-press the Vici tab to open the theme lab. Does nothing in production. */
const devListeners = IS_DEV_MODE_AVAILABLE
  ? { tabLongPress: () => router.push('/dev/theme-lab') }
  : undefined;

export default function TabsLayout() {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  // Seal finished days on open and at midnight, before any tab reads the campaign.
  useSealFinishedDays();
  // Then, once per break, the campaign-lost screen.
  useLossNotice();
  // Keep Aurora's next ring set on the phone, and open the ring screen while it rings.
  useAuroraSchedule();
  // Keeps the day's reminders in step with the day, and follows tapped notifications.
  useReminderSchedule();

  // The tabs slide as one strip of pages and follow a sideways swipe (TabSwipe, tabTransition).
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenLayout={({ children }) => <TabSwipe>{children}</TabSwipe>}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: theme.colors.background },
          ...tabTransitionOptions(width, reduceMotion),
        }}
      >
        <Tabs.Screen name="veni" options={{ title: tabsCopy.veni.plain }} />
        <Tabs.Screen name="vidi" options={{ title: tabsCopy.vidi.plain }} />
        <Tabs.Screen name="vici" options={{ title: tabsCopy.vici.plain }} listeners={devListeners} />
      </Tabs>
    </GestureHandlerRootView>
  );
}
