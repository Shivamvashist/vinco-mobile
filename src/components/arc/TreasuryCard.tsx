import { Pressable, View } from 'react-native';

import { arcCopy } from '@/copy';
import { createStyles, useFeedback, useTheme } from '@/theme';

import { Button } from '../Button';
import { Card } from '../Card';
import { Icon, type IconName } from '../Icon';
import { Txt } from '../Txt';

export type TreasuryCardProps = {
  denarii: number;
  truces: number;
  alarmPasses: number;
  /** Hidden in the Ludus, where Truces have nothing to protect. */
  showTruces: boolean;
  onOpenForum: () => void;
  onOpenTruces: () => void;
};

const copy = arcCopy.treasury;

/** What the user holds: denarii, Truces and alarm passes, and the way into the Forum. */
export function TreasuryCard({
  denarii,
  truces,
  alarmPasses,
  showTruces,
  onOpenForum,
  onOpenTruces,
}: TreasuryCardProps) {
  const styles = useStyles();
  return (
    <Card>
      <View style={styles.row}>
        <Holding icon="coin" label={copy.denarii(denarii)} color="currency" />
        {showTruces ? (
          <Holding icon="shield" label={copy.truces(truces)} hint={copy.trucesHint} onPress={onOpenTruces} />
        ) : null}
        <Holding icon="bell" label={copy.passes(alarmPasses)} />
      </View>
      <View style={styles.action}>
        <Button label={copy.visit} variant="secondary" size="compact" onPress={onOpenForum} />
      </View>
    </Card>
  );
}

type HoldingProps = {
  icon: IconName;
  label: string;
  color?: 'currency' | 'text';
  hint?: string;
  onPress?: () => void;
};

function Holding({ icon, label, color = 'text', hint, onPress }: HoldingProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const content = (
    <>
      <Icon
        name={icon}
        size={theme.layout.iconSizeSmall}
        color={color === 'currency' ? 'currency' : 'accent'}
      />
      <Txt variant="caption" color={color}>
        {label}
      </Txt>
    </>
  );
  if (!onPress) {
    return (
      <View style={styles.holding} accessible accessibilityLabel={label}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={() => {
        play('tap');
        onPress();
      }}
      style={({ pressed }) => [styles.holding, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  holding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    minHeight: theme.layout.minTouchTarget,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSunk,
  },
  pressed: { backgroundColor: theme.colors.surfaceRaised },
  action: { marginTop: theme.space.md },
}));
