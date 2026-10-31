import { router, Tabs } from 'expo-router';

import { TabBar } from '@/components/navigation/TabBar';
import { tabsCopy } from '@/copy';
import { useAuroraSchedule } from '@/hooks/useAuroraSchedule';
import { useLossNotice } from '@/hooks/useLossNotice';
import { useReminderSchedule } from '@/hooks/useReminderSchedule';
import { useSealFinishedDays } from '@/hooks/useSealFinishedDays';
import { IS_DEV_MODE_AVAILABLE } from '@/stores';
import { useTheme } from '@/theme';

/** Dev shortcut: long-press the Vici tab to open the theme lab. Does nothing in production. */
const devListeners = IS_DEV_MODE_AVAILABLE
  ? { tabLongPress: () => router.push('/dev/theme-lab') }
  : undefined;

export default function TabsLayout() {
  const theme = useTheme();
  // Seal finished days on open and at midnight, before any tab reads the campaign.
  useSealFinishedDays();
  // Then, once per break, the campaign-lost screen.
  useLossNotice();
  // Keep Aurora's next ring set on the phone, and open the ring screen while it rings.
  useAuroraSchedule();
  // Keeps the day's reminders in step with the day, and follows tapped notifications.
  useReminderSchedule();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="veni" options={{ title: tabsCopy.veni.plain }} />
      <Tabs.Screen name="vidi" options={{ title: tabsCopy.vidi.plain }} />
      <Tabs.Screen name="vici" options={{ title: tabsCopy.vici.plain }} listeners={devListeners} />
    </Tabs>
  );
}
