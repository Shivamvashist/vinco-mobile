import { View } from 'react-native';

import { type DayCardDesignId, DESIGN_FORUM_ITEMS } from '@/features/dayCard';
import type { ForumItemId } from '@/features/forum';
import { createStyles, DAY_CARD_STYLES, type DayCardStyle } from '@/theme';

import { DesignThumb } from '../dayCard/designs/DesignThumb';
import { Icon, type IconName } from '../Icon';
import { Txt } from '../Txt';

/** A card sketch about as tall as the tile (the card is 9 by 16). */
const DESIGN_THUMB_WIDTH = 23;
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

export type ItemArtProps = { itemId: ForumItemId };

/** The small picture on a Forum item: an icon, a day card swatch or design, or an app icon tile. Decorative. */
export function ItemArt({ itemId }: ItemArtProps) {
  const styles = useStyles();
  const designId = DESIGN_IDS[itemId];
  if (designId) {
    return (
      <View style={styles.tile}>
        <DesignThumb
          designId={designId}
          cardStyle={DAY_CARD_STYLES[0] as DayCardStyle}
          width={DESIGN_THUMB_WIDTH}
        />
      </View>
    );
  }
  const cardStyle = DAY_CARD_STYLES.find((style) => style.id === CARD_STYLE_IDS[itemId]);
  if (cardStyle) {
    return (
      <View
        style={[
          styles.tile,
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
      <View style={[styles.tile, iconTile === 'marble' ? styles.marble : styles.laurel]}>
        <Txt variant="heading" color={iconTile === 'marble' ? 'onInverse' : 'accent'}>
          V
        </Txt>
      </View>
    );
  }
  return (
    <View style={[styles.tile, styles.supply]}>
      <Icon name={ICONS[itemId] ?? 'coin'} color="accent" />
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
