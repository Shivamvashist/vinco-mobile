import { View } from 'react-native';

import { forumCopy } from '@/copy';
import { EARN_WAYS } from '@/features/forum';
import { createStyles } from '@/theme';

import { Txt } from '../Txt';

const copy = forumCopy.earn;

export type EarnListProps = {
  /** In the Ludus, the weekly bonus is marked as belonging to campaigns. */
  isLudus: boolean;
};

/** The Aerarium: every way to earn denarii, live ones first, later ones marked with when. */
export function EarnList({ isLudus }: EarnListProps) {
  const styles = useStyles();
  return (
    <View>
      <Txt variant="heading">{copy.title}</Txt>
      <Txt variant="caption" style={styles.subtitle}>
        {copy.subtitle}
      </Txt>
      <View style={styles.list}>
        {EARN_WAYS.map((way, index) => {
          const isLive = way.source === 'live';
          const tag = way.source === 'live' ? copy.live : copy.soon[way.source];
          const amount = copy.amount(way.amount);
          const label = copy.ways[way.id];
          return (
            <View
              key={way.id}
              style={[styles.row, index > 0 && styles.divider]}
              accessible
              accessibilityLabel={`${label}, ${amount} denarii, ${tag}`}
            >
              <View style={styles.text}>
                <Txt variant="body" color={isLive ? 'text' : 'textMuted'}>
                  {label}
                </Txt>
                <Txt variant="micro" color={isLive ? 'accent' : 'textFaint'}>
                  {tag}
                </Txt>
              </View>
              <Txt variant="label" color={isLive ? 'currency' : 'textFaint'}>
                {amount}
              </Txt>
            </View>
          );
        })}
      </View>
      {isLudus ? (
        <Txt variant="caption" style={styles.subtitle}>
          {copy.ludusNote}
        </Txt>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  subtitle: { marginTop: theme.space.xs },
  list: {
    marginTop: theme.space.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  divider: { borderTopWidth: theme.layout.hairline, borderTopColor: theme.colors.border },
  text: { flex: 1, gap: theme.space.xxs },
}));
