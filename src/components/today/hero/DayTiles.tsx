import { useWindowDimensions, View } from 'react-native';

import { createStyles } from '@/theme';

import { TabSettle } from '../../TabSettle';
import { FocusTile } from './FocusTile';
import { ReelsTile } from './ReelsTile';

/** Below this window width (divided by the font scale) the tiles stack, so the numbers never squeeze. */
const STACK_BELOW_WIDTH = 340;

/**
 * The two tiles under the hero: Reels (today against the budget) and Focus (with its play button).
 * On each return to Veni they settle in just after the hero (TabSettle).
 */
export function DayTiles() {
  const styles = useStyles();
  const { width, fontScale } = useWindowDimensions();
  const isStacked = width / Math.max(1, fontScale) < STACK_BELOW_WIDTH;
  return (
    <View style={[styles.row, isStacked && styles.stacked]}>
      <TabSettle order={1} style={isStacked ? undefined : styles.cell}>
        <ReelsTile />
      </TabSettle>
      <TabSettle order={2} style={isStacked ? undefined : styles.cell}>
        <FocusTile />
      </TabSettle>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', gap: theme.space.md },
  stacked: { flexDirection: 'column' },
  cell: { flex: 1 },
}));
