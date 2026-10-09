import { View } from 'react-native';

import { commonCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Laurel } from './Laurel';
import { Screen } from './Screen';
import { Txt } from './Txt';

/**
 * Shown instead of the app when the database can't be opened or upgraded.
 * Calm and plain: says the data is safe and what to do. Never shows the raw error.
 */
export function StartupError() {
  const styles = useStyles();
  return (
    <Screen scroll={false} gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.centre}>
        <Laurel width={120} color="textMuted" />
        <Txt variant="heading" align="center" accessibilityRole="header" style={styles.title}>
          {commonCopy.startupError.title}
        </Txt>
        <Txt variant="body" color="textMuted" align="center" style={styles.body}>
          {commonCopy.startupError.body}
        </Txt>
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: theme.space.xl },
  body: { marginTop: theme.space.md },
}));
