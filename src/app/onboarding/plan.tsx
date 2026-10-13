import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { FlowLayout } from '@/components/onboarding/FlowLayout';
import { PlanOrderCard } from '@/components/orders/PlanOrderCard';
import { AddOrderSheet } from '@/components/orders/AddOrderSheet';
import { SectionHeader } from '@/components/SectionHeader';
import { Txt } from '@/components/Txt';
import { onboardingCopy } from '@/copy';
import { CUSTOM_ORDER_LIMITS } from '@/features/orders';
import { getStepPosition, SUGGESTED_ORDERS, type SuggestedOrder, useOnboardingStore } from '@/stores';
import { createStyles } from '@/theme';

const copy = onboardingCopy.plan;

const SUGGESTION_ICONS: Record<SuggestedOrder, IconName> = { water: 'water', workout: 'workout' };

/**
 * Step I: the user's daily orders. Vinco suggests water and a workout; anything else is added
 * with a name, a unit and how many a day. Continue starts free training with these orders;
 * the secondary button goes to a ready-made campaign (Vinco's four, 30 to 90 days) instead.
 */
export default function PlanScreen() {
  const styles = useStyles();
  const picks = useOnboardingStore((state) => state.picks);
  const ownOrders = useOnboardingStore((state) => state.ownOrders);
  const togglePick = useOnboardingStore((state) => state.togglePick);
  const addOwnOrder = useOnboardingStore((state) => state.addOwnOrder);
  const removeOwnOrder = useOnboardingStore((state) => state.removeOwnOrder);
  const chooseLudus = useOnboardingStore((state) => state.chooseLudus);
  const setArcLength = useOnboardingStore((state) => state.setArcLength);
  const arcLength = useOnboardingStore((state) => state.arcLength);
  const setLastStep = useOnboardingStore((state) => state.setLastStep);
  const [isAdding, setIsAdding] = useState(false);
  const position = getStepPosition('plan', 'ludus');
  const orderCount = picks.length + ownOrders.length;
  const canAddOwn = ownOrders.length < CUSTOM_ORDER_LIMITS.maxActive;

  useEffect(() => setLastStep('plan'), [setLastStep]);

  const continueOwnPlan = () => {
    chooseLudus();
    router.push('/onboarding/tone');
  };

  const chooseCampaign = () => {
    setArcLength(arcLength);
    router.push('/onboarding/arc');
  };

  return (
    <>
      <FlowLayout
        step={position.step}
        totalSteps={position.total}
        backHref="/onboarding"
        title={copy.title}
        subtitle={copy.subtitle}
        footer={
          <View style={styles.footer}>
            <Button label={copy.continue(orderCount)} onPress={continueOwnPlan} />
            <Button
              label={copy.campaign}
              variant="secondary"
              accessibilityHint={copy.campaignHint}
              onPress={chooseCampaign}
            />
          </View>
        }
      >
        <SectionHeader title={copy.suggestedSection} />
        <View style={styles.list}>
          {SUGGESTED_ORDERS.map((order) => (
            <PlanOrderCard
              key={order}
              kind="suggestion"
              icon={SUGGESTION_ICONS[order]}
              name={copy[order].name}
              line={copy[order].line}
              isAdded={picks.includes(order)}
              onToggle={() => togglePick(order)}
              addLabel={copy.add}
              addedLabel={copy.added}
            />
          ))}
        </View>

        <SectionHeader title={copy.ownSection} />
        <View style={styles.list}>
          {ownOrders.length === 0 ? <Txt variant="caption">{copy.ownEmpty}</Txt> : null}
          {ownOrders.map((order, index) => (
            <PlanOrderCard
              key={`${order.name}-${index}`}
              kind="own"
              icon="check"
              name={order.name}
              line={copy.ownLine(order.full, order.unit)}
              removeLabel={copy.removeOwn(order.name)}
              onRemove={() => removeOwnOrder(index)}
            />
          ))}
          {canAddOwn ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.addOwn}
              onPress={() => setIsAdding(true)}
              style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
            >
              <Icon name="plus" color="accent" />
              <Txt variant="label" color="accent">
                {copy.addOwn}
              </Txt>
            </Pressable>
          ) : null}
        </View>
        {orderCount === 0 ? (
          <Txt variant="caption" style={styles.noneYet}>
            {copy.noneYet}
          </Txt>
        ) : null}
      </FlowLayout>

      <AddOrderSheet
        visible={isAdding}
        onClose={() => setIsAdding(false)}
        onSave={(draft) => {
          const error = addOwnOrder(draft);
          if (error === null) setIsAdding(false);
          return error;
        }}
      />
    </>
  );
}

const useStyles = createStyles((theme) => ({
  list: { gap: theme.space.sm, marginBottom: theme.space.lg },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
    minHeight: theme.layout.buttonHeightCompact,
    borderRadius: theme.radius.md,
    borderWidth: theme.layout.borderWidth,
    borderStyle: 'dashed',
    borderColor: theme.colors.accentBorder,
  },
  pressed: { opacity: 0.85 },
  noneYet: { marginTop: theme.space.xs },
  footer: { gap: theme.space.sm },
}));
