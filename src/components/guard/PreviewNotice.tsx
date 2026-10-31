import { View } from 'react-native';

import { guardCopy } from '@/copy';
import { createStyles, iconTile } from '@/theme';

import { Card } from '../Card';
import { Icon } from '../Icon';
import { Txt } from '../Txt';

/** Says plainly that a guard or alarm setting is saved now and works with the native build. */
export function PreviewNotice() {
  const styles = useStyles();
  return (
    <Card style={styles.notice} accessible accessibilityRole="text">
      <View style={styles.mark}>
        <Icon name="lock" color="accent" />
      </View>
      <View style={styles.text}>
        <Txt variant="label">{guardCopy.preview.title}</Txt>
        <Txt variant="caption">{guardCopy.preview.body}</Txt>
      </View>
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  notice: { flexDirection: 'row', gap: theme.space.md, padding: theme.layout.cardPadding },
  mark: iconTile(theme),
  text: { flex: 1, gap: theme.space.xxs },
}));
