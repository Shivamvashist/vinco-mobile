import { useWindowDimensions, View } from 'react-native';

import { shopCopy } from '@/copy';
import {
  type ForumCategory,
  FORUM_ITEMS,
  type ForumItem,
  type ForumItemId,
  type Holding,
} from '@/features/forum';
import { createStyles } from '@/theme';

import { TabSettle } from '../TabSettle';
import { Txt } from '../Txt';
import { CosmeticTile } from './CosmeticTile';
import { EssentialCard } from './EssentialCard';

export type ShopShelfProps = {
  holdings: Record<ForumItemId, Holding>;
  /** In free training, Truces wait for the next campaign. */
  isLudus: boolean;
  onSelect: (item: ForumItem) => void;
};

const CATEGORIES: readonly ForumCategory[] = ['supplies', 'cards', 'insignia'];
/** Below this width (dp, divided by the font scale) the tiles stack one per row. */
const TILE_PAIR_MIN_WIDTH = 340;

/**
 * The Shop's shelf: Essentials (the Truce, the alarm pass) as full-width cards, then the day
 * cards and app icons as tiles in pairs (one per row on narrow phones or large text). Each section
 * settles into place when the user comes back to the Shop.
 */
export function ShopShelf({ holdings, isLudus, onSelect }: ShopShelfProps) {
  const styles = useStyles();
  const { width, fontScale } = useWindowDimensions();
  const isStacked = width / Math.max(1, fontScale) < TILE_PAIR_MIN_WIDTH;

  return (
    <View>
      {CATEGORIES.map((category, index) => {
        const items = FORUM_ITEMS.filter((item) => item.category === category);
        return (
          <TabSettle key={category} order={index + 1} style={styles.section}>
            <View style={styles.head}>
              <Txt variant="overline" accessibilityRole="header">
                {shopCopy.categories[category]}
              </Txt>
              <Txt variant="micro">{shopCopy.categoryNotes[category]}</Txt>
            </View>
            {category === 'supplies' ? (
              <View style={styles.list}>
                {items.map((item) => (
                  <EssentialCard
                    key={item.id}
                    item={item}
                    holding={holdings[item.id]}
                    isLudus={isLudus}
                    onPress={() => onSelect(item)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.list}>
                {toRows(items, isStacked ? 1 : 2).map((row) => (
                  <View key={row.map((item) => item.id).join('-')} style={styles.row}>
                    {row.map((item) => (
                      <CosmeticTile
                        key={item.id}
                        item={item}
                        holding={holdings[item.id]}
                        onPress={() => onSelect(item)}
                        style={styles.cell}
                      />
                    ))}
                    {/* An odd last tile keeps its half, so every tile is the same size. */}
                    {!isStacked && row.length === 1 ? <View style={styles.cell} /> : null}
                  </View>
                ))}
              </View>
            )}
          </TabSettle>
        );
      })}
    </View>
  );
}

function toRows<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let start = 0; start < items.length; start += size) rows.push(items.slice(start, start + size));
  return rows;
}

const useStyles = createStyles((theme) => ({
  section: { marginTop: theme.space.xxl },
  head: { gap: theme.space.xxs, marginBottom: theme.space.md },
  list: { gap: theme.space.sm },
  row: { flexDirection: 'row', gap: theme.space.sm },
  cell: { flex: 1 },
}));
