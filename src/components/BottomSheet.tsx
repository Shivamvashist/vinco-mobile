import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { commonCopy } from '@/copy';
import { createStyles, themeTiming, useReduceMotion } from '@/theme';

import { Txt } from './Txt';

export type BottomSheetProps = {
  visible: boolean;
  /** Called on scrim tap and the Android back button. The parent sets visible to false. */
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** How far the sheet travels when entering, before its real height is known. */
const ENTER_OFFSET = 400;

/**
 * A sheet that slides up over a scrim. Stays mounted until its exit animation ends,
 * so closing never cuts off mid-slide.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [isMounted, setIsMounted] = useState(visible);
  const progress = useSharedValue(0);

  // Mount as soon as the sheet is asked to show (adjusting state during render, not in an effect).
  if (visible && !isMounted) setIsMounted(true);

  useEffect(() => {
    if (visible) {
      progress.value = reduceMotion ? 1 : withTiming(1, themeTiming('base'));
      return;
    }
    // Unmount only after the exit finishes. With reduced motion the exit takes no time.
    const exit = reduceMotion ? { duration: 0 } : themeTiming('fast', 'exit');
    progress.value = withTiming(0, exit, (finished) => {
      if (finished) scheduleOnRN(setIsMounted, false);
    });
  }, [visible, reduceMotion, progress]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * ENTER_OFFSET }],
  }));

  if (!isMounted) return null;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable
            style={styles.fill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={commonCopy.close}
          />
        </Animated.View>
        <View style={styles.anchor} pointerEvents="box-none">
          <Animated.View
            accessibilityViewIsModal
            style={[styles.sheet, { paddingBottom: styles.sheet.padding + insets.bottom }, sheetStyle]}
          >
            {title ? (
              <Txt variant="heading" accessibilityRole="header" style={styles.title}>
                {title}
              </Txt>
            ) : null}
            {children}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = createStyles((theme) => ({
  fill: { flex: 1 },
  scrim: { backgroundColor: theme.colors.scrim },
  anchor: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    padding: theme.layout.sheetPadding,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },
  title: { marginBottom: theme.space.sm },
}));
