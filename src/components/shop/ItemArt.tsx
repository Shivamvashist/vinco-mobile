import { View } from 'react-native';

import { type DayCardDesignId, DESIGN_FORUM_ITEMS } from '@/features/dayCard';
import type { ForumItemId } from '@/features/forum';
import { createStyles, DAY_CARD_STYLES, type DayCardStyle, useTheme } from '@/theme';

import { DesignThumb } from '../dayCard/designs/DesignThumb';
import { Icon, type IconName } from '../Icon';
import { Txt } from '../Txt';

/** A card sketch about as tall as the tile (the card is 9 by 16). */
const DESIGN_THUMB_WIDTH = 23;
/** The large art (shop shelves, the purchase sheet) is this much bigger than the list tile. */
const LARGE = 1.75;
const ICONS: Partial<Record<ForumItemId, IconName>> = { truce: 'shield', venia: 'bell' };
/** Day card items preview the card's own colours. */
const CARD_STYLE_IDS: Partial<Record<ForumItemId, string>> = { cardAurum: 'aurum', cardNox: 'nox' };
/** App icon items preview a small tile of the icon. */
const ICON_TILES: Partial<Record<ForumItemId, 'laurel' | 'marble'>> = {
  iconLaurel: 'laurel',
  iconMarble: 'marble',
};

/** Day card design items preview a sketch of the design. */
const DESIGN_IDS = Object.fromEntries(
  Object.entries(DESIGN_FORUM_ITEMS).map(([designId, itemId]) => [itemId, designId]),
) as Partial<Record<ForumItemId, DayCardDesignId>>;

export type ItemArtProps = {
  itemId: ForumItemId;
  /** regular: a list tile. large: a shelf or the purchase sheet. */
  size?: 'regular' | 'large';
};

/** The picture on a Shop item: an icon, a day card swatch or design, or an app icon tile. Decorative. */
export function ItemArt({ itemId, size = 'regular' }: ItemArtProps) {
  const styles = useStyles();
  const theme = useTheme();
  const isLarge = size === 'large';
  const tile = [styles.tile, isLarge && styles.tileLarge];
  const designId = DESIGN_IDS[itemId];
  if (designId) {
    return (
      <View style={tile}>
        <DesignThumb
          designId={designId}
          cardStyle={DAY_CARD_STYLES[0] as DayCardStyle}
          width={isLarge ? Math.round(DESIGN_THUMB_WIDTH * LARGE) : DESIGN_THUMB_WIDTH}
        />
      </View>
    );
  }
  const cardStyle = DAY_CARD_STYLES.find((style) => style.id === CARD_STYLE_IDS[itemId]);
  if (cardStyle) {
    return (
      <View
        style={[
          tile,
          styles.card,
          { backgroundColor: cardStyle.background, borderColor: cardStyle.frame ?? cardStyle.accent },
        ]}
      >
        <View style={[styles.cardLine, { backgroundColor: cardStyle.accent }]} />
        <View style={[styles.cardLineShort, { backgroundColor: cardStyle.foreground }]} />
      </View>
    );
  }
  const iconTile = ICON_TILES[itemId];
  if (iconTile) {
    return (
      <View style={[tile, iconTile === 'marble' ? styles.marble : styles.laurel]}>
        <Txt variant={isLarge ? 'title' : 'heading'} color={iconTile === 'marble' ? 'onInverse' : 'accent'}>
          V
        </Txt>
      </View>
    );
  }
  return (
    <View style={[tile, styles.supply]}>
      <Icon
        name={ICONS[itemId] ?? 'coin'}
        color="accent"
        size={isLarge ? Math.round(theme.layout.iconSize * LARGE * 0.8) : undefined}
      />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  tile: {
    width: theme.layout.iconTileSize + theme.space.sm,
    height: theme.layout.iconTileSize + theme.space.sm,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLarge: {
    width: Math.round((theme.layout.iconTileSize + theme.space.sm) * LARGE),
    height: Math.round((theme.layout.iconTileSize + theme.space.sm) * LARGE),
    borderRadius: theme.radius.md,
  },
  supply: { backgroundColor: theme.colors.accentSoft },
  card: { borderWidth: theme.layout.borderWidthStrong, gap: theme.space.xs },
  cardLine: { width: '50%', height: 3, borderRadius: theme.radius.pill },
  cardLineShort: { width: '30%', height: 2, borderRadius: theme.radius.pill, opacity: 0.6 },
  laurel: {
    backgroundColor: theme.colors.backgroundDeep,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
  },
  marble: { backgroundColor: theme.colors.inverse },
}));
