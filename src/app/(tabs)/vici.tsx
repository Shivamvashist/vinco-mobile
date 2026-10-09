import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ToneLine } from '@/components/ToneLine';
import { arcCopy, pickTone } from '@/copy';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

/** Vici: the arc. Rank, arc progress and settings arrive in Step 11. */
export default function ViciScreen() {
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);

  return (
    <Screen>
      <ScreenHeader eyebrow={arcCopy.eyebrow} title={arcCopy.title} />
      <View style={styles.body}>
        <ToneLine line={pickTone(arcCopy.emptyLine, tone)} tone={tone} />
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  body: { marginTop: theme.space.xxl },
}));
