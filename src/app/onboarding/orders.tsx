import { router } from 'expo-router';
import { type ReactNode, useEffect } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { FlowLayout } from '@/components/onboarding/FlowLayout';
import { Stepper } from '@/components/Stepper';
import { Txt } from '@/components/Txt';
import { onboardingCopy } from '@/copy';
import { FULL_GOAL_RANGES, WAKE_TIME_RANGE } from '@/features/orders';
import { formatClockMinutes } from '@/lib/dates';
import { ONBOARDING_STEPS, useOnboardingStore } from '@/stores';
import { createStyles, useTheme } from '@/theme';

const copy = onboardingCopy.orders;

/** Step II: the four orders. Minimums are fixed; full goals and the wake-up time can be tuned. */
export default function OrdersScreen() {
  const styles = useStyles();
  const fullGoals = useOnboardingStore((state) => state.fullGoals);
  const wakeMinutes = useOnboardingStore((state) => state.wakeMinutes);
  const setFullGoal = useOnboardingStore((state) => state.setFullGoal);
  const setWakeMinutes = useOnboardingStore((state) => state.setWakeMinutes);
  const setLastStep = useOnboardingStore((state) => state.setLastStep);

  useEffect(() => setLastStep('orders'), [setLastStep]);

  return (
    <FlowLayout
      step={2}
      totalSteps={ONBOARDING_STEPS.length}
      backHref="/onboarding/arc"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={<Button label={copy.accept} onPress={() => router.push('/onboarding/tone')} />}
    >
      <View style={styles.list}>
        <OrderCard icon="water" name={copy.water.name} minimum={copy.water.min}>
          <Stepper
            caption={copy.conquerLabel}
            value={fullGoals.water}
            onChange={(value) => setFullGoal('water', value)}
            {...FULL_GOAL_RANGES.water}
            formatValue={copy.water.full}
            accessibilityLabel={copy.water.adjust}
          />
        </OrderCard>
        <OrderCard icon="sunrise" name={copy.wake.name} minimum={copy.wake.min} note={copy.wake.note}>
          <Stepper
            caption={copy.conquerLabel}
            value={wakeMinutes}
            onChange={setWakeMinutes}
            {...WAKE_TIME_RANGE}
            formatValue={formatClockMinutes}
            accessibilityLabel={copy.wake.adjust}
          />
        </OrderCard>
        <OrderCard icon="meal" name={copy.meal.name} minimum={copy.meal.min}>
          <Stepper
            caption={copy.conquerLabel}
            value={fullGoals.meal}
            onChange={(value) => setFullGoal('meal', value)}
            {...FULL_GOAL_RANGES.meal}
            formatValue={copy.meal.full}
            accessibilityLabel={copy.meal.adjust}
          />
        </OrderCard>
        <OrderCard
          icon="workout"
          name={copy.workout.name}
          minimum={copy.workout.min}
          note={copy.workout.note}
        >
          <Stepper
            caption={copy.conquerLabel}
            value={fullGoals.workout}
            onChange={(value) => setFullGoal('workout', value)}
            {...FULL_GOAL_RANGES.workout}
            formatValue={copy.workout.full}
            accessibilityLabel={copy.workout.adjust}
          />
        </OrderCard>
      </View>
    </FlowLayout>
  );
}

type OrderCardProps = {
  icon: IconName;
  name: string;
  /** The fixed "Hold the line" minimum. */
  minimum: string;
  note?: string;
  /** The "Conquer" stepper. */
  children: ReactNode;
};

/** One order: icon, name, lock; the fixed minimum beside the tunable full goal. */
function OrderCard({ icon, name, minimum, note, children }: OrderCardProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Card bordered>
      <View style={styles.titleRow}>
        <View style={styles.iconTile}>
          <Icon name={icon} color="accent" />
        </View>
        <Txt variant="label" style={styles.name}>
          {name}
        </Txt>
        <Icon
          name="lock"
          size={theme.layout.iconSizeSmall}
          color="textMuted"
          accessibilityLabel={copy.requiredLabel}
        />
      </View>
      <View style={styles.goals}>
        <View style={[styles.goalCell, styles.minimumCell]}>
          <Txt variant="micro">{copy.holdLabel}</Txt>
          <Txt variant="label" style={styles.minimumValue}>
            {minimum}
          </Txt>
        </View>
        <View style={[styles.goalCell, styles.stepperCell]}>{children}</View>
      </View>
      {note ? (
        <Txt variant="caption" style={styles.note}>
          {note}
        </Txt>
      ) : null}
    </Card>
  );
}

const useStyles = createStyles((theme) => ({
  list: { gap: theme.space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  iconTile: {
    width: theme.layout.iconTileSize,
    height: theme.layout.iconTileSize,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  name: { flex: 1 },
  goals: { flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.md },
  goalCell: {
    flex: 1,
    minWidth: 0,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
  },
  minimumCell: {
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    justifyContent: 'center',
  },
  minimumValue: { marginTop: theme.space.xxs },
  stepperCell: { paddingLeft: theme.space.md },
  note: { marginTop: theme.space.sm },
}));
