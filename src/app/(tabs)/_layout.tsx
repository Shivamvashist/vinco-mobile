import { router, Tabs } from 'expo-router';

import { TabBar } from '@/components/navigation/TabBar';
import { tabsCopy } from '@/copy';
import { useLossNotice } from '@/hooks/useLossNotice';
import { useSealFinishedDays } from '@/hooks/useSealFinishedDays';
import { useTheme } from '@/theme';

/** Dev shortcut: long-press the Vici tab to open the theme lab. Does nothing in production. */
const devListeners = __DEV__ ? { tabLongPress: () => router.push('/dev/theme-lab') } : undefined;

export default function TabsLayout() {
  const theme = useTheme();
  // Seal finished days on open and at midnight, before any tab reads the campaign.
  useSealFinishedDays();
  // Then, once per break, the campaign-lost screen.
  useLossNotice();

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
