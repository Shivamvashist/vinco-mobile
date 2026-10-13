import { View } from 'react-native';

import { arcCopy } from '@/copy';
import type { Decoration } from '@/features/campaign';
import { createStyles } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';

export type DecorationGridProps = {
  decorations: readonly Decoration[];
};

const copy = arcCopy.decorations;

/**
 * Decorations in two columns: earned ones in gold, locked ones outlined with how to earn them,
 * so every locked medal is also a small goal.
 */
export function DecorationGrid({ decorations }: DecorationGridProps) {
  const styles = useStyles();
  const earned = decorations.filter((decoration) => decoration.isEarned).length;
  return (
    <View>
      <Txt variant="caption">{copy.count(earned, decorations.length)}</Txt>
      <View style={styles.grid}>
        {decorations.map(({ id, isEarned }) => {
          const item = copy.items[id];
          return (
            <View
              key={id}
              style={[styles.tile, isEarned ? styles.earned : styles.locked]}
              accessible
              accessibilityLabel={`${item.name}, ${isEarned ? copy.earned : item.how}`}
            >
              <Icon name="medal" color={isEarned ? 'accent' : 'textFaint'} />
              <Txt variant="label" color={isEarned ? 'text' : 'textMuted'} numberOfLines={1}>
                {item.name}
              </Txt>
              <Txt variant="micro" numberOfLines={3}>
                {isEarned ? copy.earned : item.how}
              </Txt>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.md },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: theme.space.xs,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
  },
  earned: {
    backgroundColor: theme.colors.accentTint,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
  },
  locked: {
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
}));
