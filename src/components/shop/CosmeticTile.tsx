import { type StyleProp, View, type ViewStyle } from 'react-native';

import { shopCopy } from '@/copy';
import type { ForumItem, Holding } from '@/features/forum';
import { cardSurface, createStyles, useFeedback } from '@/theme';

import { PressableScale } from '../PressableScale';
import { Txt } from '../Txt';
import { ItemArt } from './ItemArt';
import { PriceTag } from './PriceTag';

export type CosmeticTileProps = {
  /** A cosmetic: a day card style or design, or an app icon. Owned once, for good. */
  item: ForumItem;
  holding: Holding;
  onPress: () => void;
  /** Layout of the tile in its grid (a share of the row, or the full width). */
  style?: StyleProp<ViewStyle>;
};

/**
 * A cosmetic on the Shop's shelf, as a tile: the art on a sunk stage, the name, when it works,
 * and the price (or "Owned" in gold, with the stage warmed). Opens the purchase sheet.
 */
export function CosmeticTile({ item, holding, onPress, style }: CosmeticTileProps) {
  const styles = useStyles();
  const play = useFeedback();
  const copy = shopCopy.items[item.id];
  const isOwned = holding.held > 0;
  const status = isOwned
    ? item.category === 'cards'
      ? shopCopy.status.onDayCard
      : shopCopy.status.worksWithBuild
    : item.works === 'native'
      ? shopCopy.status.worksWithBuild
      : null;
  const label = [copy.name, isOwned ? shopCopy.status.owned : shopCopy.priceLabel(item.price), status]
    .filter(Boolean)
    .join(', ');

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      scaleTo="card"
      onPress={() => {
        play('tap');
        onPress();
      }}
      containerStyle={style}
      style={styles.tile}
      pressedStyle={styles.pressed}
    >
      <View style={[styles.stage, isOwned && styles.stageOwned]}>
        <ItemArt itemId={item.id} size="large" />
      </View>
      <View style={styles.text}>
        <Txt variant="label" numberOfLines={1}>
          {copy.name}
        </Txt>
        {status ? (
          <Txt variant="micro" numberOfLines={2}>
            {status}
          </Txt>
        ) : null}
      </View>
      <PriceTag price={item.price} isOwned={isOwned} />
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  tile: {
    flex: 1,
    gap: theme.space.sm,
    padding: theme.space.md,
    ...cardSurface(theme),
  },
  pressed: { backgroundColor: theme.colors.surfaceRaised },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.lg,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.surfaceSunk,
  },
  stageOwned: { backgroundColor: theme.colors.accentTint },
  text: { flex: 1, gap: theme.space.xxs },
}));
