import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { Button } from '@/components/Button';
import { type DayCardRow, DayCard } from '@/components/dayCard/DayCard';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Toast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { dayCardCopy } from '@/copy';
import { getArcPosition } from '@/features/arc';
import { type OrderKind } from '@/features/orders';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useCampaign } from '@/hooks/useCampaign';
import { type TodayOrders, useTodayOrders } from '@/hooks/useTodayOrders';
import { formatClockTime } from '@/lib/dates';
import { createStyles, DAY_CARD_STYLES, type DayCardStyle, useFeedback } from '@/theme';

const SWATCH_SIZE = 44;

/** "Day sealed": the shareable day card, in three styles. */
export default function DayCardScreen() {
  const styles = useStyles();
  const play = useFeedback();
  const { arc, targets } = useActiveArc();
  const orders = useTodayOrders(targets);
  const campaign = useCampaign(arc, targets, orders.today);
  const cardRef = useRef<View>(null);
  const [cardStyle, setCardStyle] = useState<DayCardStyle>(DAY_CARD_STYLES[0] as DayCardStyle);
  const [isSharing, setIsSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const position = arc ? getArcPosition(arc.startDay, arc.lengthDays, orders.today) : null;
  const dayNumber = position?.phase === 'active' ? position.dayNumber : (arc?.lengthDays ?? 1);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

  const share = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setToast(dayCardCopy.shareUnavailable);
        return;
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: dayCardCopy.share });
      play('confirm');
      setToast(dayCardCopy.shared);
    } catch (error) {
      if (__DEV__) console.warn('[day card] Sharing failed.', error);
      setToast(dayCardCopy.shareFailed);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Screen scroll={false} gutter="none" edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton icon="close" accessibilityLabel={dayCardCopy.close} onPress={close} />
        <Txt variant="caption" style={styles.headerTitle} accessibilityRole="header">
          {dayCardCopy.header}
        </Txt>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <DayCard
          ref={cardRef}
          dayNumber={dayNumber}
          lengthDays={arc?.lengthDays ?? dayNumber}
          rows={describeRows(orders)}
          campaign={campaign.campaign}
          rankName={campaign.rank.current?.name ?? null}
          cardStyle={cardStyle}
        />
        <View style={styles.swatches} accessibilityRole="radiogroup">
          {DAY_CARD_STYLES.map((option) => {
            const isSelected = option.id === cardStyle.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={dayCardCopy.styleLabel(option.name)}
                onPress={() => {
                  play('select');
                  setCardStyle(option);
                }}
                style={[
                  styles.swatch,
                  { backgroundColor: option.background },
                  isSelected && styles.swatchSelected,
                ]}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={dayCardCopy.share} loading={isSharing} cue={null} onPress={() => void share()} />
        <Button
          label={dayCardCopy.seeProgress}
          variant="secondary"
          size="compact"
          cue={null}
          onPress={() => router.navigate('/vidi')}
        />
      </View>
      <Toast message={toast} onHide={hideToast} />
    </Screen>
  );
}

/** Today's four orders as card rows. */
function describeRows(orders: TodayOrders): DayCardRow[] {
  const values = dayCardCopy.values;
  const row = (kind: OrderKind, label: string, value: string): DayCardRow => ({
    label,
    value,
    isDone: orders.statuses[kind] !== 'none',
  });
  return [
    row('water', dayCardCopy.rows.water, values.litres(orders.amounts.water)),
    row('wake', dayCardCopy.rows.wake, orders.wokeAt ? formatClockTime(orders.wokeAt) : values.notDone),
    row('meal', dayCardCopy.rows.meal, values.meals(orders.amounts.meal)),
    row(
      'workout',
      dayCardCopy.rows.workout,
      orders.amounts.workout > 0 ? values.minutes(orders.amounts.workout) : values.notDone,
    ),
  ];
}

const useStyles = createStyles((theme) => ({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.space.sm },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: theme.layout.minTouchTarget },
  body: { paddingVertical: theme.space.md, alignItems: 'center' },
  swatches: { flexDirection: 'row', gap: theme.space.md, marginTop: theme.space.xl },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  swatchSelected: { borderColor: theme.colors.accent },
  footer: { paddingHorizontal: theme.layout.flowGutter, paddingBottom: theme.space.lg, gap: theme.space.sm },
}));
