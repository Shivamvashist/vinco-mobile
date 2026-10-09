import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ToneLine } from '@/components/ToneLine';
import { pickTone, progressCopy } from '@/copy';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

/** Vidi: the proof. Calendar, stats and selfies arrive in Step 10. */
export default function VidiScreen() {
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);

  return (
    <Screen>
      <ScreenHeader eyebrow={progressCopy.eyebrow} title={progressCopy.title} />
      <View style={styles.body}>
        <ToneLine line={pickTone(progressCopy.emptyLine, tone)} tone={tone} />
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  body: { marginTop: theme.space.xxl },
}));
