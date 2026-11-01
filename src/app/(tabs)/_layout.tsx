import { router, Tabs, useSegments } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CrashScreen } from '@/components/CrashScreen';
import { TabBar } from '@/components/navigation/TabBar';
import { TabsHeader } from '@/components/navigation/TabsHeader';
import { TabSwipe } from '@/components/navigation/TabSwipe';
import { tabTransitionOptions } from '@/components/navigation/tabTransition';
import { isTabName, type TabName, tabsCopy } from '@/copy';
import { useAuroraSchedule } from '@/hooks/useAuroraSchedule';
import { useLossNotice } from '@/hooks/useLossNotice';
import { useReminderSchedule } from '@/hooks/useReminderSchedule';
import { useSealFinishedDays } from '@/hooks/useSealFinishedDays';
import { useWakeWatch } from '@/hooks/useWakeWatch';
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
  // With the guard service on: "Are you up?" on the first unlock after 3 am until wake-up is logged.
  useWakeWatch();

  // The tab on screen, for the header. A stack screen over the tabs (the Forum, Focus) keeps the
  // last one, so the header doesn't change underneath it.
  const segment = useSegments().find(isTabName);
  const [tab, setTab] = useState<TabName>(segment ?? 'veni');
  if (segment && segment !== tab) setTab(segment);

  // One header above the tabs, outside the slide (TabsHeader). The tabs slide as one strip of
  // pages and follow a sideways swipe (TabSwipe, tabTransition). Tabs out of sight are NOT frozen
  // (freezeOnBlur): unfreezing under the slide left a tab blank on Android now and then.
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <TabsHeader tab={tab} />
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

/** A tab that throws while drawing shows a recovery screen in place, inside the app's theme. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return <CrashScreen error={error} where="tabs" retry={() => void retry()} />;
}
