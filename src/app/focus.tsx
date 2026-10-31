import { router, Stack, useNavigation } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

import { FocusActive } from '@/components/focus/FocusActive';
import { FocusComplete } from '@/components/focus/FocusComplete';
import { FocusSetup } from '@/components/focus/FocusSetup';
import { launchRewardFlight } from '@/components/hud';
import { Screen } from '@/components/Screen';
import { allowedPackagesFor, type FocusGuard, planRetreatPayment } from '@/features/focus';
import { useDialerPackage } from '@/hooks/useDialerPackage';
import { useFocus } from '@/hooks/useFocus';
import { useFocusLock } from '@/hooks/useFocusLock';
import { useFocusLog } from '@/hooks/useFocusLog';
import { useFocusNotice } from '@/hooks/useFocusNotice';
import { useFocusPurse } from '@/hooks/useFocusPurse';
import { useGuardPermissions } from '@/hooks/useGuardPermissions';
import { useFocusUiStore, useGuardStore, usePreferencesStore } from '@/stores';
import { createStyles, themeSpring, useFeedback, useReduceMotion } from '@/theme';

/** How far a new stage (setup, active, complete) rises as it springs in. */
const STAGE_RISE = 24;

/**
 * Focus ("Acies"): the setup, the running focus and its result, opened from the Focus tile on
 * Today. Under Silentium the running focus can't be left (useFocusLock); otherwise Back minimises
 * it to Today, where the tile shows the time left. Spec: docs/TODAY-AND-FOCUS.md section 4.
 */
export default function FocusScreen() {
  const styles = useStyles();
  const play = useFeedback();
  const focus = useFocus();
  const purse = useFocusPurse();
  const log = useFocusLog();
  const permissions = useGuardPermissions();
  const dialerPackage = useDialerPackage();
  const tone = usePreferencesStore((state) => state.tone);
  const { comites, toggleComes } = useGuardStore(
    useShallow((state) => ({ comites: state.comites, toggleComes: state.toggleComes })),
  );
  const markSeen = useFocusUiStore((state) => state.markSeen);
  const navigation = useNavigation();
  const stage = focus.settled ? 'complete' : focus.running ? 'active' : 'setup';
  const isLocked = stage === 'active' && focus.running?.guard === 'silentium';
  useFocusNotice(stage === 'active');
  const settledId = focus.settled?.id ?? null;
  useFocusLock(isLocked);

  // A result shown here is seen once the screen goes (Done, Back, or the app moving on). Marked as
  // the screen starts to leave, so the Focus tile on Today never opens the same result again.
  useEffect(() => {
    if (settledId == null) return;
    const unsubscribe = navigation.addListener('beforeRemove', () => markSeen(settledId));
    return () => {
      unsubscribe();
      markSeen(settledId);
    };
  }, [settledId, markSeen, navigation]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

  const handleBegin = (minutes: number, guard: FocusGuard) => {
    const result = focus.start(minutes, guard, allowedPackagesFor(comites, dialerPackage));
    if (result === 'started') play('focusStart');
    return result;
  };

  return (
    <GestureHandlerRootView style={styles.fill}>
      <Stack.Screen options={{ gestureEnabled: !isLocked }} />
      <Screen scroll={false} gutter="none" edges={[]}>
        <Stage key={stage}>
          {stage === 'complete' && focus.settled ? (
            <FocusComplete
              session={focus.settled}
              tone={tone}
              // The pay is in the records since completion: the flight counts up to it.
              onClaim={(from, rewards) => launchRewardFlight({ from, rewards, isAlreadyCounted: true })}
              onDone={close}
            />
          ) : stage === 'active' && focus.running ? (
            <FocusActive
              session={focus.running}
              remainingMs={focus.remainingMs}
              truceReserve={purse.truceReserve}
              retreatPayment={planRetreatPayment(purse.truceReserve, purse.denarii)}
              onRetreat={focus.retreat}
              comites={comites}
              dialerPackage={dialerPackage}
              isLocked={isLocked}
              onMinimise={close}
            />
          ) : (
            <FocusSetup
              tone={tone}
              today={focus.today}
              rewardedToday={focus.rewardedToday}
              truceReserve={purse.truceReserve}
              comites={comites}
              onToggleComes={toggleComes}
              permissions={permissions}
              log={log}
              onBegin={handleBegin}
              onGetTruce={() => router.push('/forum')}
              onClose={close}
            />
          )}
        </Stage>
      </Screen>
    </GestureHandlerRootView>
  );
}

/** Each stage rises and fades in on the settle spring when it takes over the screen. */
function Stage({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const reduceMotion = useReduceMotion();
  const enter = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!reduceMotion) enter.set(withSpring(1, themeSpring('settle')));
  }, [enter, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: enter.get(),
    transform: [{ translateY: (1 - enter.get()) * STAGE_RISE }],
  }));

  return <Animated.View style={[styles.fill, style]}>{children}</Animated.View>;
}

const useStyles = createStyles(() => ({ fill: { flex: 1 } }));
