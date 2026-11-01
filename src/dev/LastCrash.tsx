/**
 * DEV ONLY: the last error that broke a screen or closed the app (lib/crashLog), so a crash on a
 * test phone can be read without a cable. Selectable, with Clear.
 */
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Txt } from '@/components/Txt';
import { devCopy } from '@/copy';
import { clearLastCrash, readLastCrash } from '@/lib/crashLog';
import { createStyles } from '@/theme';

export function LastCrash() {
  const styles = useStyles();
  const [record, setRecord] = useState(readLastCrash);
  if (!record) return null;

  return (
    <View style={styles.box}>
      <Txt variant="label">{devCopy.lastCrash(new Date(record.at).toLocaleString(), record.where)}</Txt>
      <Txt variant="caption" color="danger" selectable>
        {record.message}
      </Txt>
      {record.stack ? (
        <Txt variant="micro" color="textMuted" selectable>
          {record.stack}
        </Txt>
      ) : null}
      <Button
        label={devCopy.clearCrash}
        variant="ghost"
        size="compact"
        onPress={() => {
          clearLastCrash();
          setRecord(null);
        }}
      />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  box: {
    marginTop: theme.space.md,
    padding: theme.space.md,
    gap: theme.space.xs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunk,
  },
}));
