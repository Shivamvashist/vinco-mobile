import { todayCopy } from '@/copy';
import { createStyles } from '@/theme';

import { Card } from '../Card';
import { PlanOrderCard } from '../orders/PlanOrderCard';
import { Txt } from '../Txt';

export type NoOrdersCardProps = {
  onAddWater: () => void;
};

const copy = todayCopy.noOrders;

/** Free training with no orders yet: one suggestion (water), one tap to add it. */
export function NoOrdersCard({ onAddWater }: NoOrdersCardProps) {
  const styles = useStyles();
  return (
    <Card bordered style={styles.card}>
      <Txt variant="label">{copy.title}</Txt>
      <PlanOrderCard
        kind="suggestion"
        icon="water"
        name={copy.waterName}
        line={copy.waterLine}
        isAdded={false}
        onToggle={onAddWater}
        addLabel={copy.add}
        addedLabel={copy.added}
      />
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  card: { gap: theme.space.sm },
}));
