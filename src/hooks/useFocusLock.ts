import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/**
 * Silentium (Lockdown): while `isLocked`, Back, the back gesture and any navigation that would
 * remove this screen do nothing, so the focus screen can't be left until the focus ends or the
 * user retreats. Lifted the moment `isLocked` turns false. The swipe-back gesture is switched off
 * by the screen itself (gestureEnabled).
 */
export function useFocusLock(isLocked: boolean): void {
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLocked) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    const unsubscribe = navigation.addListener('beforeRemove', (event) => event.preventDefault());
    return () => {
      back.remove();
      unsubscribe();
    };
  }, [isLocked, navigation]);
}
