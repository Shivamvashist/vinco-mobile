import { View } from 'react-native';

import { guardCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';

/** Says plainly that a guard or alarm setting is saved now and works with the native build. */
export function PreviewNotice() {
  const styles = useStyles();
  return (
    <View style={styles.notice} accessible accessibilityRole="text">
      <Icon name="lock" color="accent" />
      <View style={styles.text}>
        <Txt variant="label">{guardCopy.preview.title}</Txt>
        <Txt variant="caption">{guardCopy.preview.body}</Txt>
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  notice: {
    flexDirection: 'row',
    gap: theme.space.md,
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
  },
  text: { flex: 1, gap: theme.space.xxs },
}));
