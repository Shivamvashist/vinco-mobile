import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { commonCopy, onboardingCopy } from '@/copy';
import { createStyles } from '@/theme';

import { IconButton } from '../IconButton';
import { ProgressBar } from '../ProgressBar';
import { Screen } from '../Screen';
import { Txt } from '../Txt';

export type FlowLayoutProps = {
  /** 1-based position among the onboarding steps. */
  step: number;
  totalSteps: number;
  /** Where Back goes when there is no history (the app was reopened mid-onboarding). */
  backHref: Href;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Pinned under the scrolling content: the step's main button. */
  footer: ReactNode;
  /**
   * Scrolls by default. Turn off for a step whose content fills the screen (the camera):
   * the body then takes exactly the space between the title and the footer.
   */
  scroll?: boolean;
};

/** The shared frame of an onboarding step: back, progress, title, scrolling body, pinned footer. */
export function FlowLayout({
  step,
  totalSteps,
  backHref,
  title,
  subtitle,
  children,
  footer,
  scroll = true,
}: FlowLayoutProps) {
  const styles = useStyles();

  const heading = (
    <>
      <Txt variant="title" accessibilityRole="header">
        {title}
      </Txt>
      {subtitle ? (
        <Txt variant="body" color="textMuted" style={styles.subtitle}>
          {subtitle}
        </Txt>
      ) : null}
    </>
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(backHref);
  };

  return (
    <Screen scroll={false} gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.back}>
          <IconButton icon="back" accessibilityLabel={commonCopy.back} onPress={handleBack} />
        </View>
        <View style={styles.progress}>
          <ProgressBar
            segments={{ total: totalSteps, filled: step }}
            size="thin"
            accessibilityLabel={onboardingCopy.stepAccessibilityLabel(step, totalSteps)}
          />
        </View>
        <Txt variant="caption" accessibilityElementsHidden importantForAccessibility="no">
          {onboardingCopy.stepLabel(step, totalSteps)}
        </Txt>
      </View>

      {scroll ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {heading}
          <View style={styles.children}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.body, styles.bodyFixed]}>
          {heading}
          <View style={[styles.children, styles.childrenFill]}>{children}</View>
        </View>
      )}

      <View style={styles.footer}>{footer}</View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  // Pull the back button to the edge so its icon lines up with the text column.
  back: { marginLeft: -theme.space.md },
  progress: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { paddingTop: theme.space.xxl, paddingBottom: theme.space.xl },
  bodyFixed: { paddingTop: theme.space.xl, paddingBottom: theme.space.md },
  subtitle: { marginTop: theme.space.sm },
  children: { marginTop: theme.space.xxl },
  childrenFill: { flex: 1, marginTop: theme.space.lg },
  footer: { paddingTop: theme.space.md, gap: theme.space.xs },
}));
