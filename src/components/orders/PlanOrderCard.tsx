import { Pressable, View } from 'react-native';

import { createStyles, useFeedback, useTheme } from '@/theme';

import { Icon, type IconName } from '../Icon';
import { IconButton } from '../IconButton';
import { Txt } from '../Txt';

type CommonProps = {
  icon: IconName;
  name: string;
  /** "Up to 4 L a day", "12 glass a day". */
  line: string;
};

export type PlanOrderCardProps = CommonProps &
  (
    | {
        /** A suggestion from Vinco: tap to add it to the plan, tap again to take it out. */
        kind: 'suggestion';
        isAdded: boolean;
        onToggle: () => void;
        addedLabel: string;
        addLabel: string;
      }
    | {
        /** One of the user's own orders: the cross removes it. */
        kind: 'own';
        removeLabel: string;
        onRemove: () => void;
      }
  );

/** An order to pick (onboarding, and Today with no orders): a suggestion to add, or one the user wrote. */
export function PlanOrderCard(props: PlanOrderCardProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const { icon, name, line } = props;

  const body = (
    <>
      <View style={styles.iconTile}>
        <Icon name={icon} color="accent" />
      </View>
      <View style={styles.text}>
        <Txt variant="label" numberOfLines={1}>
          {name}
        </Txt>
        <Txt variant="caption" numberOfLines={2}>
          {line}
        </Txt>
      </View>
    </>
  );

  if (props.kind === 'own') {
    return (
      <View style={[styles.card, styles.added]}>
        {body}
        <IconButton
          icon="close"
          color="textMuted"
          accessibilityLabel={props.removeLabel}
          onPress={props.onRemove}
        />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: props.isAdded }}
      accessibilityLabel={`${name}, ${line}`}
      onPress={() => {
        play(props.isAdded ? 'stepDown' : 'select');
        props.onToggle();
      }}
      style={({ pressed }) => [styles.card, props.isAdded && styles.added, pressed && styles.pressed]}
    >
      {body}
      <View style={[styles.toggle, props.isAdded && styles.toggleOn]}>
        <Icon
          name={props.isAdded ? 'check' : 'plus'}
          size={theme.layout.iconSizeSmall}
          color={props.isAdded ? 'onAccent' : 'accent'}
        />
        <Txt variant="labelSmall" color={props.isAdded ? 'onAccent' : 'accent'}>
          {props.isAdded ? props.addedLabel : props.addLabel}
        </Txt>
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingVertical: theme.space.md,
    paddingLeft: theme.space.md,
    paddingRight: theme.space.sm,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidthStrong,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSunk,
  },
  added: { borderColor: theme.colors.accentBorder, backgroundColor: theme.colors.accentTint },
  pressed: { opacity: 0.85 },
  iconTile: {
    width: theme.layout.iconTileSize,
    height: theme.layout.iconTileSize,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  text: { flex: 1, minWidth: 0, gap: theme.space.xxs },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    minHeight: theme.layout.chipHeight,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
  },
  toggleOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
}));
