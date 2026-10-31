import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { createStyles } from '@/theme';

import { Txt } from './Txt';

export type ScreenHeaderProps = {
  /** Small inscription above the title, for example "DAY XII OF LX". Shown in caps. */
  eyebrow: string;
  title: string;
  caption?: string;
  /** Optional element on the right, such as the HUD counters and the user button. */
  accessory?: ReactNode;
};

/**
 * The header pattern shared by the tab screens: eyebrow, title, caption, optional accessory.
 * When the accessory would leave the title too little room (a narrow phone, large text), it moves
 * to its own row above, at the right, so the title never breaks mid-word.
 */
export function ScreenHeader({ eyebrow, title, caption, accessory }: ScreenHeaderProps) {
  const styles = useStyles();
  const [rowWidth, setRowWidth] = useState(0);
  const [accessoryWidth, setAccessoryWidth] = useState(0);
  const isStacked =
    accessory != null && rowWidth > 0 && rowWidth - accessoryWidth - styles.row.gap < styles.text.minWidth;

  const accessoryView = accessory ? (
    <View
      style={[styles.accessory, isStacked && styles.accessoryStacked]}
      onLayout={(event) => setAccessoryWidth(event.nativeEvent.layout.width)}
    >
      {accessory}
    </View>
  ) : null;

  return (
    <View onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
      {isStacked ? accessoryView : null}
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
        {isStacked ? null : accessoryView}
      </View>
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
    /** Room kept for the title before the accessory moves above it. */
    minWidth: theme.space.giant * 2.5,
  },
  title: { marginTop: theme.space.xxs },
  caption: { marginTop: theme.space.xs },
  accessory: { flexShrink: 0 },
  accessoryStacked: { alignSelf: 'flex-end', marginBottom: theme.space.sm },
}));
