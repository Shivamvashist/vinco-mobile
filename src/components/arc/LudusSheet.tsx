import { useState } from 'react';
import { View } from 'react-native';

import { arcCopy } from '@/copy';
import { createStyles } from '@/theme';

import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Txt } from '../Txt';

export type LudusSheetProps = {
  visible: boolean;
  /** True while a campaign is still running: then it says the campaign ends today. */
  isLeavingCampaign: boolean;
  onClose: () => void;
  /** Moves to the Ludus. Returns false when it could not be saved. */
  onConfirm: () => boolean;
};

const copy = arcCopy.choice;

/** Confirms moving to the Ludus. Never a wipe: the record stays in Past arcs. */
export function LudusSheet({ visible, isLeavingCampaign, onClose, onConfirm }: LudusSheetProps) {
  const styles = useStyles();
  const [hasFailed, setHasFailed] = useState(false);
  const close = () => {
    setHasFailed(false);
    onClose();
  };
  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={isLeavingCampaign ? copy.ludusSheetTitle : copy.toLudus}
    >
      <Txt variant="body" color="textMuted">
        {copy.ludusSheetBody}
      </Txt>
      {hasFailed ? (
        <Txt variant="caption" color="danger" accessibilityRole="alert" style={styles.error}>
          {copy.failed}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button
          label={copy.ludusConfirm}
          variant={isLeavingCampaign ? 'secondary' : 'primary'}
          cue="confirm"
          onPress={() => {
            if (onConfirm()) close();
            else setHasFailed(true);
          }}
        />
        <Button label={copy.cancel} variant="ghost" cue={null} onPress={close} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  error: { marginTop: theme.space.sm },
  actions: { marginTop: theme.space.lg, gap: theme.space.xs },
}));
