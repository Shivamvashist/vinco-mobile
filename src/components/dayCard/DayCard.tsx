import { type ComponentType, forwardRef } from 'react';
import { View } from 'react-native';

import { dayCardCopy } from '@/copy';
import { type DayCardDesignId, DEFAULT_DAY_CARD_DESIGN } from '@/features/dayCard';
import { toRoman } from '@/lib/toRoman';
import { createStyles, type DayCardStyle } from '@/theme';

import { ClassicDesign } from './designs/ClassicDesign';
import { InscriptionDesign } from './designs/InscriptionDesign';
import { LaurelDesign } from './designs/LaurelDesign';
import { MementoDesign } from './designs/MementoDesign';
import { NumeralDesign } from './designs/NumeralDesign';
import { SolDesign } from './designs/SolDesign';
import { StampDesign } from './designs/StampDesign';
import { CARD_HEIGHT, CARD_WIDTH, type DayCardContent, type DayCardDesignProps } from './designs/types';

export type { DayCardRow } from './designs/types';

export type DayCardProps = DayCardContent & {
  cardStyle: DayCardStyle;
  /** The layout. Defaults to the classic card with order rows. */
  design?: DayCardDesignId;
};

const DESIGNS: Record<DayCardDesignId, ComponentType<DayCardDesignProps>> = {
  classic: ClassicDesign,
  numeral: NumeralDesign,
  laurel: LaurelDesign,
  sol: SolDesign,
  inscription: InscriptionDesign,
  stamp: StampDesign,
  memento: MementoDesign,
};

/**
 * The shareable day card in one of its designs and colour styles. Fixed size and its own palette,
 * so a shared card looks the same on every phone. The ref is for capture.
 */
export const DayCard = forwardRef<View, DayCardProps>(function DayCard(
  { design = DEFAULT_DAY_CARD_DESIGN, ...content },
  ref,
) {
  const styles = useStyles();
  const { cardStyle, dayNumber, lengthDays, isLudus = false, rows } = content;
  const Design = DESIGNS[design] ?? ClassicDesign;
  const heldCount = rows.filter((row) => row.isDone).length;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        styles.card,
        { backgroundColor: cardStyle.background },
        cardStyle.frame ? [styles.framed, { borderColor: cardStyle.frame }] : null,
      ]}
      accessible
      accessibilityLabel={dayCardCopy.cardLabel(
        toRoman(dayNumber),
        isLudus ? null : toRoman(lengthDays),
        heldCount,
        rows.length,
      )}
    >
      <Design {...content} />
    </View>
  );
});

const useStyles = createStyles((theme) => ({
  framed: { borderWidth: 3 },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: theme.radius.lg - theme.space.xxs,
  },
}));
