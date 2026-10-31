import { View } from 'react-native';

import { todayCopy } from '@/copy';
import { createStyles, useFeedback, useTheme } from '@/theme';

import { BottomSheet } from '../BottomSheet';
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

export type DailyLogSheetProps = {
  visible: boolean;
  onClose: () => void;
  items: readonly DailyLogItem[];
};

const copy = todayCopy.quickLogs;

/**
 * The daily log: the selfie, weight and calories in one sheet, each a row with today's value or
 * "Not yet". A row hands over to its own capture (the camera, the weight or calories sheet).
 * None of them affects sealing the day.
 */
export function DailyLogSheet({ visible, onClose, items }: DailyLogSheetProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.sheetTitle}>
      <Txt variant="caption">{copy.sheetCaption}</Txt>
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
              <View style={[styles.iconTile, isDone && styles.iconTileDone]}>
                <Icon name={item.icon} color={isDone ? 'accent' : 'textMuted'} />
              </View>
              <View style={styles.text}>
                <Txt variant="label">{item.title}</Txt>
                <Txt variant="caption" color={isDone ? 'accent' : 'textMuted'} numberOfLines={1}>
                  {item.value ?? copy.notYet}
                </Txt>
              </View>
              <Icon name={isDone ? 'edit' : 'forward'} size={theme.layout.iconSizeSmall} color="textMuted" />
            </PressableScale>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  list: { marginTop: theme.space.lg, gap: theme.space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    minHeight: theme.layout.buttonHeight + theme.space.md,
    paddingHorizontal: theme.layout.cardPadding,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
    backgroundColor: theme.colors.surfaceSunk,
  },
  iconTile: {
    width: theme.layout.iconTileSize,
    height: theme.layout.iconTileSize,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  iconTileDone: { backgroundColor: theme.colors.accentSoft },
  text: { flex: 1, gap: theme.space.xxs },
}));
