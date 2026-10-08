import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { createStyles, type ColorRole, useTheme } from '@/theme';

export type ScreenProps = {
  children: ReactNode;
  /** Scrolls by default. Turn off for screens with a pinned footer button. */
  scroll?: boolean;
  /** `tab` for tab screens, `flow` for onboarding and full-screen flows, `none` for edge-to-edge. */
  gutter?: 'tab' | 'flow' | 'none';
  /** Which edges keep clear of the notch and gesture bar. Tab screens leave the bottom to the tab bar. */
  edges?: Edge[];
  background?: ColorRole;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Wrapper for every screen: themed background plus safe-area padding,
 * so content never hides behind the status bar or the gesture bar.
 */
export function Screen({
  children,
  scroll = true,
  gutter = 'tab',
  edges = ['top'],
  background = 'background',
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();
  const styles = useStyles();
  const gutterStyle = styles[gutter];
  const backgroundStyle = { backgroundColor: theme.colors[background] };

  return (
    <SafeAreaView style={[styles.safeArea, backgroundStyle]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[gutterStyle, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, gutterStyle, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const useStyles = createStyles((theme) => ({
  safeArea: { flex: 1 },
  fill: { flex: 1 },
  tab: {
    paddingHorizontal: theme.layout.screenGutter,
    paddingTop: theme.space.xl,
    paddingBottom: theme.space.xxl,
  },
  flow: {
    paddingHorizontal: theme.layout.flowGutter,
    paddingTop: theme.space.xxl,
    paddingBottom: theme.space.xxxl,
  },
  none: {},
}));
