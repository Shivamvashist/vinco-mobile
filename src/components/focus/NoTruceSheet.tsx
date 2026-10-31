import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { TRUCES } from '@/features/campaign';
import { FOCUS_RULES } from '@/features/focus';
import { createStyles } from '@/theme';

export type NoTruceSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Opens the Forum to buy a Truce. */
  onGetTruce: () => void;
  onBeginAnyway: () => void;
};

const copy = focusCopy.noTruce;

/** Before a focus begins with no Truce held: what retreating early would cost. Neutral in every tone. */
export function NoTruceSheet({ visible, onClose, onGetTruce, onBeginAnyway }: NoTruceSheetProps) {
  const styles = useStyles();
  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <View style={styles.body}>
        <Txt variant="body" color="textMuted">
          {copy.body(TRUCES.priceDenarii, FOCUS_RULES.standDownSeconds)}
        </Txt>
        <Button label={copy.getTruce} onPress={onGetTruce} variant="secondary" />
        <Button label={copy.beginAnyway} onPress={onBeginAnyway} cue={null} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  body: { gap: theme.space.md },
}));
