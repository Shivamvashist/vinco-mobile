import type { ReactNode } from 'react';
import { View } from 'react-native';

import { createStyles } from '@/theme';

import { Txt } from './Txt';

export type ScreenHeaderProps = {
  /** Small inscription above the title, for example "DAY XII OF LX". Shown in caps. */
  eyebrow: string;
  title: string;
  caption?: string;
  /** Optional element on the right, such as the orders ring on Today. */
  accessory?: ReactNode;
};

/** The header pattern shared by the tab screens: eyebrow, title, caption, optional accessory. */
export function ScreenHeader({ eyebrow, title, caption, accessory }: ScreenHeaderProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Txt variant="eyebrow">{eyebrow}</Txt>
        <Txt variant="title" accessibilityRole="header" style={styles.title}>
          {title}
        </Txt>
        {caption ? (
          <Txt variant="caption" style={styles.caption}>
            {caption}
          </Txt>
        ) : null}
      </View>
      {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.md,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: { marginTop: theme.space.xxs },
  caption: { marginTop: theme.space.xs },
  accessory: { flexShrink: 0 },
}));
