import { useWindowDimensions, View } from 'react-native';

import { createStyles } from '@/theme';

import { FocusTile } from './FocusTile';
import { ReelsTile } from './ReelsTile';

/** Below this window width (divided by the font scale) the tiles stack, so the numbers never squeeze. */
const STACK_BELOW_WIDTH = 340;

/** The two tiles under the hero: Reels (today against the budget) and Focus (with its play button). */
export function DayTiles() {
  const styles = useStyles();
  const { width, fontScale } = useWindowDimensions();
  return (
    <View style={[styles.row, width / Math.max(1, fontScale) < STACK_BELOW_WIDTH && styles.stacked]}>
      <ReelsTile />
      <FocusTile />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', gap: theme.space.md },
  stacked: { flexDirection: 'column' },
}));
