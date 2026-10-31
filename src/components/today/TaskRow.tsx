import { type AccessibilityActionEvent, Pressable, View } from 'react-native';

import type { OrderStatus } from '@/features/orders';
import { cardSurface, createStyles } from '@/theme';

import { Icon } from '../Icon';
import { PressableScale } from '../PressableScale';
import { ProgressBar } from '../ProgressBar';
import { StatusCircle } from '../StatusCircle';
import { Txt } from '../Txt';

/**
 * Buttons on the row. stepper: a minus and a plus on the right, for orders with levels.
 * check: the status circle toggles done and not done, for done-or-not orders.
 */
export type RowControls = { type: 'stepper'; canAdd: boolean; canRemove: boolean } | { type: 'check' };

export type TaskRowProps = {
  name: string;
  /** Progress line under the name: "2 of 4 L · minimum held". */
  line: string;
  status: OrderStatus;
  /** Inline action on the right ("Log"), for rows without controls. Hidden once conquered. */
  action?: string;
  /** Segmented bar under the line, for water. */
  segments?: { total: number; filled: number };
  controls?: RowControls;
  /** Adds (or, on a done-or-not order, toggles). */
  onPress: () => void;
  /** Undo one step. */
  onLongPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
};

/** The controls are 44 wide; the press feedback stays inside the row. */
const HIT_SLOP = 4;

/**
 * One order on Today: status circle, name, progress line, optional bar, then either an inline
 * action or controls. Tap adds, long press takes one back; the minus, plus and check do the same
 * in one visible place. For screen readers the row is one control with increment and decrement.
 */
export function TaskRow({
  name,
  line,
  status,
  action,
  segments,
  controls,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
}: TaskRowProps) {
  const styles = useStyles();
  const isHeld = status !== 'none';
  const isConquered = status === 'full';
  const isStepper = controls?.type === 'stepper';
  const isCheck = controls?.type === 'check';

  const handleAction = (event: AccessibilityActionEvent) => {
    const actionName = event.nativeEvent.actionName;
    if (actionName === 'increment' && (!isStepper || controls.canAdd)) onPress();
    else if (actionName === 'decrement' && (!isStepper || controls.canRemove)) onLongPress();
    else if (actionName === 'longpress') onLongPress();
  };

  return (
    <PressableScale
      scaleTo="row"
      accessibilityRole={isCheck ? 'checkbox' : isStepper ? 'adjustable' : 'button'}
      accessibilityState={isCheck ? { checked: isConquered } : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityActions={
        isStepper
          ? [{ name: 'increment' }, { name: 'decrement' }]
          : [{ name: 'longpress', label: accessibilityHint }]
      }
      onAccessibilityAction={handleAction}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.row, isConquered && styles.rowConquered]}
      pressedStyle={styles.pressed}
    >
      {isCheck ? (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          hitSlop={HIT_SLOP}
          accessible={false}
          style={({ pressed }) => [styles.circleButton, pressed && styles.controlPressed]}
        >
          <StatusCircle status={status} />
        </Pressable>
      ) : (
        <StatusCircle status={status} />
      )}
      <View style={styles.text}>
        <Txt variant="label" color={isConquered ? 'textMuted' : 'text'} numberOfLines={1}>
          {name}
        </Txt>
        <Txt variant="caption" color={isHeld ? 'accent' : 'textMuted'} numberOfLines={1} style={styles.line}>
          {line}
        </Txt>
        {segments ? (
          <View style={styles.bar}>
            <ProgressBar segments={segments} />
          </View>
        ) : null}
      </View>
      {isStepper ? (
        <View style={styles.stepper} importantForAccessibility="no-hide-descendants">
          <StepButton icon="minus" isEnabled={controls.canRemove} onPress={onLongPress} />
          <StepButton icon="plus" isEnabled={controls.canAdd} onPress={onPress} />
        </View>
      ) : action && !isConquered && !isCheck ? (
        <Txt variant="labelSmall" color="accent" numberOfLines={1}>
          {action}
        </Txt>
      ) : null}
    </PressableScale>
  );
}

type StepButtonProps = { icon: 'minus' | 'plus'; isEnabled: boolean; onPress: () => void };

/** A round minus or plus. Disabled ones stay visible but faint, so the row never jumps. */
function StepButton({ icon, isEnabled, onPress }: StepButtonProps) {
  const styles = useStyles();
  return (
    <PressableScale
      accessible={false}
      disabled={!isEnabled}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      style={[styles.step, !isEnabled && styles.stepDisabled]}
      pressedStyle={styles.controlPressed}
    >
      <Icon name={icon} color={isEnabled ? 'accent' : 'textFaint'} strokeWidth={2.2} />
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.layout.cardPadding,
    minHeight: theme.layout.buttonHeight,
    ...cardSurface(theme),
  },
  // Done: it sinks to the bottom of the list, quieter, with the laurel circle as its mark.
  rowConquered: { borderColor: theme.colors.accentBorder, backgroundColor: theme.colors.surfaceSunk },
  pressed: { opacity: 0.85 },
  text: { flex: 1, minWidth: 0 },
  line: { marginTop: theme.space.xxs },
  bar: { marginTop: theme.space.xs },
  circleButton: {
    minWidth: theme.layout.minTouchTarget,
    minHeight: theme.layout.minTouchTarget,
    marginLeft: -theme.space.sm,
    marginRight: -theme.space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs, marginRight: -theme.space.xs },
  step: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
  },
  stepDisabled: { borderColor: theme.colors.border, backgroundColor: 'transparent' },
  controlPressed: { opacity: 0.6 },
}));
