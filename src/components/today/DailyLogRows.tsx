import { View } from 'react-native';

import { createStyles, useFeedback, useTheme } from '@/theme';

import { Icon, type IconName } from '../Icon';
import { PressableScale } from '../PressableScale';
import { Txt } from '../Txt';

export type DailyLogItem = {
  key: string;
  icon: IconName;
  /** "Selfie", "Weight", "Calories". */
  title: string;
  /** The logged value ("72.4 kg", "Selfie taken"), or null while not logged today. */
  value: string | null;
  hint: string;
  onPress: () => void;
};

export type DailyLogRowsProps = {
  items: readonly DailyLogItem[];
};

/**
 * The selfie, weight and calories as rows in Today's Tasks list: the name until logged today,
 * then the value in the accent. A row hands over to its own capture (the camera, the weight or
 * calories sheet). None of them affects sealing the day.
 */
export function DailyLogRows({ items }: DailyLogRowsProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();

  return (
    <View style={styles.list}>
      {items.map((item) => {
        const isDone = item.value != null;
        return (
          <PressableScale
            key={item.key}
            scaleTo="row"
            accessibilityRole="button"
            accessibilityLabel={item.value ?? item.title}
            accessibilityHint={item.hint}
            onPress={() => {
              play('tap');
              item.onPress();
            }}
            style={styles.row}
          >
            <Icon
              name={item.icon}
              size={theme.layout.iconSizeSmall}
              color={isDone ? 'accent' : 'textMuted'}
            />
            <Txt variant="label" color={isDone ? 'accent' : 'text'} style={styles.text} numberOfLines={1}>
              {item.value ?? item.title}
            </Txt>
            <Icon name={isDone ? 'check' : 'plus'} size={theme.layout.iconSizeSmall} color="textMuted" />
          </PressableScale>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  list: { gap: theme.space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    minHeight: theme.layout.buttonHeight,
    paddingHorizontal: theme.layout.cardPadding,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
    backgroundColor: theme.colors.surfaceSunk,
  },
  text: { flex: 1 },
}));
