import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';

import { commonCopy } from '@/copy';
import { describeError, recordCrash } from '@/lib/crashLog';
import { createStyles } from '@/theme';

import { Button } from './Button';
import { Screen } from './Screen';
import { Txt } from './Txt';

export type CrashScreenProps = {
  error: Error;
  /** Draws the screen again. */
  retry: () => void;
  /** Which boundary caught it ("root", "tabs"), kept with the record. */
  where: string;
};

/**
 * Shown in place of a screen that threw while drawing, instead of the app closing. Calm: the
 * records are safe, one way forward, and the error's first lines (selectable) for the developer.
 * The error is also kept on the phone (lib/crashLog).
 */
export function CrashScreen({ error, retry, where }: CrashScreenProps) {
  const styles = useStyles();
  const { message, stack } = describeError(error);

  useEffect(() => {
    recordCrash(error, where);
  }, [error, where]);

  return (
    <Screen scroll={false} gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Txt variant="heading" accessibilityRole="header">
          {commonCopy.crash.title}
        </Txt>
        <Txt variant="body" color="textMuted">
          {commonCopy.crash.body}
        </Txt>
        <ScrollView style={styles.details} contentContainerStyle={styles.detailsContent}>
          <Txt variant="caption" color="danger" selectable>
            {message}
          </Txt>
          {stack ? (
            <Txt variant="micro" color="textMuted" selectable>
              {stack}
            </Txt>
          ) : null}
        </ScrollView>
        <Button label={commonCopy.crash.retry} onPress={retry} />
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  body: { flex: 1, justifyContent: 'center', gap: theme.space.md },
  details: {
    flexGrow: 0,
    maxHeight: '45%',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunk,
  },
  detailsContent: { padding: theme.space.md, gap: theme.space.sm },
}));
