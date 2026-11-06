import { View } from 'react-native';

import { auroraSetupCopy } from '@/copy';
import { createStyles, useTheme } from '@/theme';

import { Icon, type IconName } from '../Icon';
import { Txt } from '../Txt';

const points = auroraSetupCopy.intro.points;

const POINTS: readonly { icon: IconName; text: string }[] = [
  { icon: 'alarm', text: points.rings },
  { icon: 'workout', text: points.mission },
  { icon: 'check', text: points.logs },
];

/** The setup flow's first step: what Aurora does, in three short lines with a glyph each. */
export function AuroraSetupIntro() {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.list}>
      {POINTS.map((point) => (
        <View key={point.icon} style={styles.point}>
          <View style={styles.glyph}>
            <Icon name={point.icon} size={theme.layout.iconSize} color="accent" />
          </View>
          <Txt variant="bodyLarge" style={styles.text}>
            {point.text}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  list: { gap: theme.space.lg },
  point: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  glyph: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  text: { flex: 1 },
}));
