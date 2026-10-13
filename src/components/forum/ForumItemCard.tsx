import { Pressable, View } from 'react-native';

import { forumCopy } from '@/copy';
import type { ForumItem, Holding } from '@/features/forum';
import { createStyles, useFeedback } from '@/theme';

import { Icon } from '../Icon';
import { Txt } from '../Txt';
import { ItemArt } from './ItemArt';

export type ForumItemCardProps = {
  item: ForumItem;
  holding: Holding;
  /** In the Ludus, Truces wait for the next campaign. */
  isLudus?: boolean;
  onPress: () => void;
};

const COIN_SIZE = 14;

/** One item in the Forum: art, name, a status line (held, owned, when it works) and the price. */
export function ForumItemCard({ item, holding, isLudus = false, onPress }: ForumItemCardProps) {
  const styles = useStyles();
  const play = useFeedback();
  const copy = forumCopy.items[item.id];
  const status = describeStatus(item, holding, isLudus);
  const isOwned = item.kind === 'cosmetic' && holding.held > 0;
  const label = [copy.name, isOwned ? forumCopy.status.owned : forumCopy.priceLabel(item.price), status]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        play('tap');
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ItemArt itemId={item.id} />
      <View style={styles.text}>
        <Txt variant="label">{copy.name}</Txt>
        {copy.latin ? <Txt variant="micro">{copy.latin}</Txt> : null}
        {status ? (
          <Txt variant="caption" color={isOwned ? 'accent' : 'textMuted'} numberOfLines={2}>
            {status}
          </Txt>
        ) : null}
      </View>
      {isOwned ? (
        <Icon name="check" color="accent" />
      ) : (
        <View style={styles.price}>
          <Icon name="coin" size={COIN_SIZE} color="currency" strokeWidth={2} />
          <Txt variant="label" color="currency">
            {forumCopy.price(item.price)}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

/** "1 of 3 held", "Owned", or when the item starts working. */
function describeStatus(item: ForumItem, holding: Holding, isLudus: boolean): string | null {
  const status = forumCopy.status;
  if (item.kind === 'consumable') {
    const held = status.held(holding.held, item.maxHeld);
    if (item.id === 'venia') return `${held} · ${status.worksWithAurora}`;
    return isLudus ? `${held} · ${status.keptForCampaign}` : held;
  }
  if (holding.held > 0) return item.category === 'cards' ? status.onDayCard : status.worksWithBuild;
  return item.works === 'native' ? status.worksWithBuild : null;
}

const useStyles = createStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    padding: theme.layout.cardPadding,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  pressed: { backgroundColor: theme.colors.surfaceRaised },
  text: { flex: 1, minWidth: 0, gap: theme.space.xxs },
  price: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
}));
