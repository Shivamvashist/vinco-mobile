import { View } from 'react-native';

import { shopCopy } from '@/copy';
import type { ForumItem, Holding } from '@/features/forum';
import { cardSurface, createStyles, useFeedback } from '@/theme';

import { PressableScale } from '../PressableScale';
import { Txt } from '../Txt';
import { ItemArt } from './ItemArt';
import { PriceTag } from './PriceTag';

export type EssentialCardProps = {
  /** A consumable: the Truce or the alarm pass. */
  item: ForumItem;
  holding: Holding;
  /** In free training, Truces wait for the next campaign. */
  isLudus?: boolean;
  onPress: () => void;
};

/**
 * An essential on the Shop's shelf, full width: large art, the name and what it does, a pip for
 * each one it can hold (filled for each held), and the price. Opens the purchase sheet.
 */
export function EssentialCard({ item, holding, isLudus = false, onPress }: EssentialCardProps) {
  const styles = useStyles();
  const play = useFeedback();
  const copy = shopCopy.items[item.id];
  const held = Math.max(0, Math.min(holding.held, item.maxHeld));
  const note =
    item.id === 'venia' ? shopCopy.status.worksWithAurora : isLudus ? shopCopy.status.keptForCampaign : null;
  const heldText = shopCopy.status.held(held, item.maxHeld);
  const label = [copy.name, shopCopy.priceLabel(item.price), heldText, note].filter(Boolean).join(', ');

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      scaleTo="card"
      onPress={() => {
        play('tap');
        onPress();
      }}
      style={styles.card}
      pressedStyle={styles.pressed}
    >
      <ItemArt itemId={item.id} size="large" />
      <View style={styles.body}>
        <View>
          <Txt variant="headingSmall" numberOfLines={1}>
            {copy.name}
          </Txt>
          {copy.latin ? <Txt variant="micro">{copy.latin}</Txt> : null}
        </View>
        <Txt variant="caption" numberOfLines={2}>
          {copy.description}
        </Txt>
        <View style={styles.footer}>
          <View style={styles.held}>
            <View style={styles.pips}>
              {Array.from({ length: item.maxHeld }, (_, index) => (
                <View key={index} style={[styles.pip, index < held && styles.pipFull]} />
              ))}
            </View>
            <Txt variant="micro" numberOfLines={1} style={styles.heldText}>
              {note ?? heldText}
            </Txt>
          </View>
          <PriceTag price={item.price} />
        </View>
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    padding: theme.space.lg,
    ...cardSurface(theme),
  },
  pressed: { backgroundColor: theme.colors.surfaceRaised },
  body: { flex: 1, minWidth: 0, gap: theme.space.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.space.sm,
    marginTop: theme.space.xs,
  },
  held: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, flexShrink: 1 },
  pips: { flexDirection: 'row', gap: theme.space.xs },
  pip: {
    width: theme.space.sm,
    height: theme.space.sm,
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.borderStrong,
  },
  pipFull: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  heldText: { flexShrink: 1 },
}));
